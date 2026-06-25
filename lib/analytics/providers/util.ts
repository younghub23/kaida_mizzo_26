// Shared helpers for the live analytics providers (Meta, LinkedIn, TikTok,
// Google). Server-only — these are imported solely by lib/analytics/load.ts.

import {
  getCoreMetrics,
  type Kpi,
  type MetricKey,
  type PostRow,
  type RealNetwork,
  type TrendPoint,
  type AudienceData,
} from '@/app/(dashboard)/analytics/mock-data'
import type { FollowerProfile } from '@/lib/analytics/cross-channel'

/**
 * Per-platform live result. Each part is independent: a provider returns live
 * `kpis`, `posts`, `trend`, `audience`, and/or a `followers` roster, and `null`
 * for whatever it couldn't fetch live (the loader then keeps the mock baseline
 * for that part). Returning `null` from the provider entirely means "nothing
 * live — use mock".
 *
 * `followers` is the per-platform roster (handle + name + bio) the cross-channel
 * matcher consumes (lib/analytics/cross-channel.ts). No platform API exposes a
 * follower roster today, so every provider returns `followers: null` — that null
 * is the activation point: wire a real follower source and matches go live.
 */
export type PlatformAnalytics = {
  kpis: Kpi[] | null
  posts: PostRow[] | null
  /** Daily engagement/reach time series for the trend chart, or null. */
  trend: TrendPoint[] | null
  /** Demographics + active-hours for the audience section, or null. */
  audience: AudienceData | null
  followers: FollowerProfile[] | null
}

/** A connected social account row (subset of `social_accounts`). */
export type ConnectedAccount = {
  platform: string
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  platform_user_id: string | null
}

/** A live data provider: returns live data, or null to fall back to mock. */
export type Provider = (account: ConnectedAccount) => Promise<PlatformAnalytics | null>

/**
 * Build a platform's KPI cards from LIVE data only. A card is emitted ONLY for
 * a metric the live API actually returned — unmapped metrics are omitted
 * entirely (never shown with a mock value), so every number on the page is
 * real. We reuse the catalog's label/format for each metric (static metadata,
 * not data) and set deltaPct to null because real period-over-period isn't
 * computed yet — the UI hides the "vs last period" line when it's null.
 */
export function overlayKpis(
  platform: RealNetwork,
  live: Partial<Record<MetricKey, number>>
): Kpi[] {
  return getCoreMetrics(platform)
    .filter((k) => live[k.key] !== undefined)
    .map((k) => ({ ...k, value: Math.round(live[k.key]! * 10) / 10, deltaPct: null }))
}

/** Engagement rate as a percentage, guarding divide-by-zero. */
export function rate(interactions: number, denominator: number): number {
  if (!denominator) return 0
  return Math.round((interactions / denominator) * 1000) / 10
}

/** JSON fetch that throws on a non-2xx so providers funnel every failure into a
 *  single try/catch → mock fallback. Payload-level error checks live in each
 *  provider (their error envelopes differ). */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return (await res.json()) as T
}
