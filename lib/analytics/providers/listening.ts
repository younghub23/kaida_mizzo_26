// ============================================================================
// SOCIAL LISTENING RESOLVER (infrastructure — not yet integrated)
// ----------------------------------------------------------------------------
// Social listening needs a brand-monitoring API (Brandwatch / Talkwalker /
// Mention-style) for the brand-mention stream, with sentiment classified by
// Claude. NO connected social account provides a cross-web mention stream. This
// resolver is wired into the loader so the section activates automatically once
// such an integration is configured; until then it returns `null` and the
// section renders an empty state (never fake mentions).
//
// To integrate later: read the integration's API key, pull recent brand
// mentions, classify sentiment via lib/anthropic.ts, and return real
// `ListeningData`.
// ============================================================================

import type { ListeningData } from '@/app/(dashboard)/analytics/mock-data'

export async function fetchSocialListening(): Promise<ListeningData | null> {
  // No brand-monitoring integration configured yet.
  return null
}
