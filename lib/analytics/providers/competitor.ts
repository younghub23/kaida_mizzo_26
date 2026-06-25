// ============================================================================
// COMPETITOR BENCHMARK RESOLVER (infrastructure — not yet integrated)
// ----------------------------------------------------------------------------
// Competitor benchmarking needs a third-party competitive-intelligence API
// (Rival IQ / Sprout / Brandwatch-style) — NO connected social account exposes
// rivals' engagement, follower growth, or share of voice. This resolver is
// wired into the loader so the section activates automatically once such an
// integration is configured; until then it returns `null` and the section
// renders an empty state (never fake competitor numbers).
//
// To integrate later: read the integration's API key (e.g. RIVALIQ_API_KEY),
// fetch the tracked competitor set + the brand's own metrics, and return real
// `Competitor[]` rows.
// ============================================================================

import type { Competitor } from '@/app/(dashboard)/analytics/mock-data'

export async function fetchCompetitorBenchmark(): Promise<Competitor[] | null> {
  // No competitive-intelligence integration configured yet.
  return null
}
