// ============================================================================
// AI chat roles ("modes"). Two roles, two tiers:
//   • Content Strategist — Growth/Pro/Agency (see canUseContentStrategist)
//   • Data Analyst       — Pro/Agency only   (see canUseDataAnalyst)
// This module is import-safe on both the client and the server (no secrets,
// no server-only imports), so the UI and the API route share one source.
// ============================================================================

export type AiMode = 'content_strategist' | 'data_analyst'

export type AiModeMeta = {
  value: AiMode
  label: string
  tagline: string
  /** Short blurb shown on the empty-conversation state. */
  intro: string
  /** Example prompts to seed an empty conversation. */
  starters: string[]
}

export const AI_MODES: AiModeMeta[] = [
  {
    value: 'content_strategist',
    label: 'Content Strategist',
    tagline: 'Create viral-ready content tailored to your audience',
    intro:
      'I generate the actual content — posts reverse-engineered for maximum virality and targeted to your demographic. Ask me to write a post, tell you the best times to post, or adapt one idea for every channel.',
    starters: [
      'Write a launch post for our new product, reverse-engineered to go viral',
      'What are the best times for us to post this week?',
      'Take this idea and specialize it for Instagram, TikTok, and LinkedIn',
    ],
  },
  {
    value: 'data_analyst',
    label: 'Data Analyst',
    tagline: 'Competitor intelligence & inspiration from your field',
    intro:
      'I find successful accounts and content in your field targeting the same demographic, and synthesize what is working for your competitors. Let me find similar brands automatically, or paste a brand/handle and I will break down its strategy.',
    starters: [
      'Find brands similar to us that are winning with our target audience',
      'Analyze @competitor and tell me what is working for them',
      'What content themes are trending among competitors in our space?',
    ],
  },
]

export const DEFAULT_AI_MODE: AiMode = 'content_strategist'

export function getModeMeta(mode: AiMode): AiModeMeta {
  return AI_MODES.find((m) => m.value === mode) ?? AI_MODES[0]
}

export function isAiMode(value: unknown): value is AiMode {
  return value === 'content_strategist' || value === 'data_analyst'
}
