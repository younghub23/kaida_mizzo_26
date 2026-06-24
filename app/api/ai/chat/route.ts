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
  // --- Pre-flight: everything that must return a real HTTP status code -------
  // (Once we start streaming the response status is 200, so all validation,
  // auth, plan gating and the initial DB writes happen here.)
  let convId: string
  let title: string
  let system: string
  let apiMessages: Anthropic.Messages.MessageParam[]
  let tools: Anthropic.Messages.ToolUnion[] | undefined

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

    let brandContext = ''
    if (profile && canUseAi(plan)) {
      brandContext = buildBrandContext(
        profile.full_name ?? '',
        profile.industry ?? '',
        parseBrandProfile(profile.brand_profile)
      )
    }

    // Strategist grounding: general for the first 5 posts, then real history.
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
            const when = p.scheduled_at
              ? new Date(p.scheduled_at as string).toISOString()
              : 'unknown time'
            const platforms = Array.isArray(p.platforms) ? (p.platforms as string[]).join(', ') : ''
            const snippet = ((p.content as string) ?? '').replace(/\s+/g, ' ').slice(0, 140)
            return `- [${when}]${platforms ? ` (${platforms})` : ''} ${snippet}`
          })
          .join('\n')
      }
      strategistCtx = { publishedPostCount, postHistory }
    }

    // Ensure a conversation row (auto-save).
    if (conversationId) {
      const { data: existing } = await supabase
        .from('ai_conversations')
        .select('id, title')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()
      if (!existing) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
      convId = existing.id as string
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
    await supabase.from('ai_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: messages[messages.length - 1].content,
    })

    system = buildSystemPrompt(mode, brandContext, strategistCtx)
    tools =
      mode === 'data_analyst'
        ? ([{ type: 'web_search_20260209', name: 'web_search' }] as unknown as Anthropic.Messages.ToolUnion[])
        : undefined
    apiMessages = messages.map((m) => ({ role: m.role, content: m.content }))
  } catch (err) {
    logError('ai/chat', 'Pre-flight failed', err)
    return NextResponse.json({ error: 'Failed to start response' }, { status: 500 })
  }

  // --- Stream the model output as newline-delimited JSON frames -------------
  const encoder = new TextEncoder()
  const conversationId = convId

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`))

      let fullText = ''
      try {
        send({ type: 'meta', conversationId, title })

        // Server-tool (web search) loop: resume on pause_turn.
        let guard = 0
        while (guard <= MAX_PAUSE_TURNS) {
          const modelStream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            messages: apiMessages,
            ...(tools ? { tools } : {}),
          })

          modelStream.on('text', (delta: string) => {
            fullText += delta
            send({ type: 'delta', text: delta })
          })

          const final = await modelStream.finalMessage()
          if (final.stop_reason === 'pause_turn' && guard < MAX_PAUSE_TURNS) {
            apiMessages.push({
              role: 'assistant',
              content: final.content as unknown as Anthropic.Messages.ContentBlockParam[],
            })
            guard++
            continue
          }
          break
        }

        const assistantText = fullText.trim()
        if (!assistantText) {
          send({ type: 'error', error: 'No response from AI' })
          controller.close()
          return
        }

        // Persist the assistant reply + bump the conversation timestamp.
        const supabase = await createClient()
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantText,
        })
        await supabase
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId)

        send({ type: 'done' })
      } catch (err) {
        logError('ai/chat', 'Streaming failed', err)
        const message =
          err instanceof Anthropic.APIError && err.status === 429
            ? 'The AI assistant is temporarily unavailable due to high demand. Please try again in a few minutes.'
            : 'Failed to generate response'
        send({ type: 'error', error: message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
