import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { anthropic } from '@/lib/anthropic'
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

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `${SYSTEM_PROMPTS[type]} Respond with only a JSON object: { "options": string[] }. Do not include any other text.`,
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
