import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

type GenerateType = 'social' | 'email_subject' | 'email_body'

const SYSTEM_PROMPTS: Record<GenerateType, string> = {
  social:
    'You are a social media expert. Generate 3 distinct caption options for a small business. Each should be engaging, under 280 characters, and end with relevant hashtags. Return as JSON array of 3 strings.',
  email_subject:
    'You are an email marketing expert. Generate 3 distinct, compelling email subject line options for a small business campaign. Return as JSON array of 3 strings.',
  email_body:
    'You are an email marketing expert. Generate 3 distinct short email body options (2-4 sentences each) for a small business campaign. Return as JSON array of 3 strings.',
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPTS[type]} Respond with a JSON object: { "options": string[] }.` },
        { role: 'user', content: prompt },
      ],
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      console.error('[ai/generate] No content in OpenAI response', JSON.stringify(completion))
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const parsed = JSON.parse(content) as { options?: string[] }

    if (!parsed.options || !Array.isArray(parsed.options) || parsed.options.length !== 3) {
      console.error('[ai/generate] Unexpected response shape', content)
      return NextResponse.json({ error: 'Unexpected AI response format' }, { status: 500 })
    }

    return NextResponse.json({ options: parsed.options })
  } catch (err) {
    console.error('[ai/generate] Failed to generate content:', err)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
