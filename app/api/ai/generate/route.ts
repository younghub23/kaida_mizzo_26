import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { canUseAi } from '@/lib/analytics/plan'
import { parseBrandProfile, buildBrandContext } from '@/lib/brand'
import { logError } from '@/lib/log'

type GenerateType = 'social' | 'email_subject' | 'email_body'

const SYSTEM_PROMPTS: Record<GenerateType, string> = {
  social:
    'You are a social media expert. Generate 3 distinct caption options for a small business. Each should be engaging, under 280 characters, and end with relevant hashtags. Return as JSON array of 3 strings.',
  email_subject:
    'You are an email marketing expert. Generate 3 distinct, compelling email subject line options for a small business campaign. Return as JSON array of 3 strings.',
  email_body:
    'You are an email marketing expert. Generate 3 distinct short email body options (2-4 sentences each) for a small business campaign. Return as JSON array of 3 strings.',
}

function stripCodeFence(text: string): string {
  const match = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return match ? match[1] : text
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, type } = (await req.json()) as {
      prompt?: string
      type?: GenerateType
    }

    if (!prompt || !type || !SYSTEM_PROMPTS[type]) {
      return NextResponse.json({ error: 'Invalid prompt or type' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      logError('ai/generate', 'ANTHROPIC_API_KEY is not set')
      return NextResponse.json({ error: 'AI service is not configured' }, { status: 500 })
    }

    // Inject the user's brand profile as context — only on AI-enabled plans
    // (Growth/Pro/Agency). See lib/analytics/plan.ts and lib/brand.ts.
    let brandContext = ''
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, industry, brand_profile, plan')
        .eq('id', user.id)
        .single()
      if (profile && canUseAi(profile.plan ?? 'free')) {
        const context = buildBrandContext(
          profile.full_name ?? '',
          profile.industry ?? '',
          parseBrandProfile(profile.brand_profile)
        )
        if (context) {
          brandContext = `\n\nBrand context for this business (tailor the output to it):\n${context}`
        }
      }
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `${SYSTEM_PROMPTS[type]} Respond with only a JSON object: { "options": string[] }. Do not include any other text.${brandContext}`,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = message.content[0]
    const content = block?.type === 'text' ? block.text : undefined

    if (!content) {
      logError('ai/generate', 'No content in Anthropic response', undefined, { message })
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const parsed = JSON.parse(stripCodeFence(content)) as { options?: string[] }

    if (!parsed.options || !Array.isArray(parsed.options) || parsed.options.length !== 3) {
      logError('ai/generate', 'Unexpected response shape', undefined, { content })
      return NextResponse.json({ error: 'Unexpected AI response format' }, { status: 500 })
    }

    return NextResponse.json({ options: parsed.options })
  } catch (err) {
    logError('ai/generate', 'Failed to generate content', err)

    if (err instanceof Anthropic.APIError && err.status === 429) {
      return NextResponse.json(
        { error: 'The AI assistant is temporarily unavailable due to high demand. Please try again in a few minutes.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
