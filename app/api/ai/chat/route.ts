import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { canUseAi, canUseContentStrategist, canUseDataAnalyst } from '@/lib/analytics/plan'
import { parseBrandProfile, buildBrandContext } from '@/lib/brand'
import { buildSystemPrompt, REAL_ANALYTICS_POST_THRESHOLD } from '@/lib/ai/prompts'
import { isAiMode, type AiMode } from '@/lib/ai/modes'
import { logError } from '@/lib/log'

const MODEL = 'claude-opus-4-8'
const MAX_TOKENS = 16000
const MAX_PAUSE_TURNS = 6

type IncomingMessage = { role: 'user' | 'assistant'; content: string }

function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= 60) return clean || 'New conversation'
  return `${clean.slice(0, 57)}…`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      conversationId?: string
      mode?: AiMode
      messages?: IncomingMessage[]
    }
    const { conversationId, mode } = body
    const messages = body.messages ?? []

    if (!mode || !isAiMode(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      logError('ai/chat', 'ANTHROPIC_API_KEY is not set')
      return NextResponse.json({ error: 'AI service is not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, industry, brand_profile, plan')
      .eq('id', user.id)
      .single()
    const plan = profile?.plan ?? 'free'

    // --- Plan gating (server-side, per role) ---------------------------------
    if (mode === 'content_strategist' && !canUseContentStrategist(plan)) {
      return NextResponse.json(
        { error: 'The AI Content Strategist requires a Growth, Pro, or Agency plan.' },
        { status: 403 }
      )
    }
    if (mode === 'data_analyst' && !canUseDataAnalyst(plan)) {
      return NextResponse.json(
        { error: 'The AI Data Analyst is available on Pro and Agency plans.' },
        { status: 403 }
      )
    }

    // --- Brand context (AI-enabled plans only) -------------------------------
    let brandContext = ''
    if (profile && canUseAi(plan)) {
      brandContext = buildBrandContext(
        profile.full_name ?? '',
        profile.industry ?? '',
        parseBrandProfile(profile.brand_profile)
      )
    }

    // --- Strategist grounding: general for the first 5 posts, then real data -
    let strategistCtx: { publishedPostCount: number; postHistory?: string } | undefined
    if (mode === 'content_strategist') {
      const { count } = await supabase
        .from('scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'published')
      const publishedPostCount = count ?? 0

      let postHistory: string | undefined
      if (publishedPostCount >= REAL_ANALYTICS_POST_THRESHOLD) {
        const { data: posts } = await supabase
          .from('scheduled_posts')
          .select('content, platforms, scheduled_at')
          .eq('user_id', user.id)
          .eq('status', 'published')
          .order('scheduled_at', { ascending: false })
          .limit(20)
        postHistory = (posts ?? [])
          .map((p) => {
            const when = p.scheduled_at ? new Date(p.scheduled_at as string).toISOString() : 'unknown time'
            const platforms = Array.isArray(p.platforms) ? (p.platforms as string[]).join(', ') : ''
            const snippet = ((p.content as string) ?? '').replace(/\s+/g, ' ').slice(0, 140)
            return `- [${when}]${platforms ? ` (${platforms})` : ''} ${snippet}`
          })
          .join('\n')
      }
      strategistCtx = { publishedPostCount, postHistory }
    }

    // --- Ensure a conversation row (auto-save) -------------------------------
    let convId = conversationId
    let title = ''
    if (convId) {
      const { data: existing } = await supabase
        .from('ai_conversations')
        .select('id, title')
        .eq('id', convId)
        .eq('user_id', user.id)
        .single()
      if (!existing) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
      title = (existing.title as string) ?? 'New conversation'
    } else {
      const firstUser = messages.find((m) => m.role === 'user')?.content ?? 'New conversation'
      title = deriveTitle(firstUser)
      const { data: created, error: createErr } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, mode, title })
        .select('id')
        .single()
      if (createErr || !created) {
        logError('ai/chat', 'Failed to create conversation', createErr)
        return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 })
      }
      convId = created.id as string
    }

    // Persist the new user turn (the last message in the thread).
    const userTurn = messages[messages.length - 1].content
    await supabase.from('ai_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: userTurn,
    })

    // --- Call Claude with the full conversation ------------------------------
    const system = buildSystemPrompt(mode, brandContext, strategistCtx)
    const tools =
      mode === 'data_analyst'
        ? ([{ type: 'web_search_20260209', name: 'web_search' }] as unknown as Anthropic.Messages.ToolUnion[])
        : undefined

    const apiMessages: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: apiMessages,
      ...(tools ? { tools } : {}),
    })

    // Server-tool (web search) loop: resume on pause_turn.
    let guard = 0
    while (response.stop_reason === 'pause_turn' && guard < MAX_PAUSE_TURNS) {
      apiMessages.push({
        role: 'assistant',
        content: response.content as unknown as Anthropic.Messages.ContentBlockParam[],
      })
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: apiMessages,
        ...(tools ? { tools } : {}),
      })
      guard++
    }

    const assistantText = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n\n')
      .trim()

    if (!assistantText) {
      logError('ai/chat', 'Empty assistant response', undefined, { stop: response.stop_reason })
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Persist the assistant reply and bump the conversation timestamp.
    await supabase.from('ai_messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: assistantText,
    })
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId)
      .eq('user_id', user.id)

    return NextResponse.json({ conversationId: convId, title, assistant: assistantText })
  } catch (err) {
    logError('ai/chat', 'Failed to generate chat response', err)

    if (err instanceof Anthropic.APIError && err.status === 429) {
      return NextResponse.json(
        {
          error:
            'The AI assistant is temporarily unavailable due to high demand. Please try again in a few minutes.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
