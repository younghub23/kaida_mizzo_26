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
  type TimeSlot,
  type RoiRow,
} from '@/app/(dashboard)/analytics/mock-data'
import type { FollowerProfile } from '@/lib/analytics/cross-channel'

/**
 * Per-platform live result. Each part is independent: a provider returns live
 * data for whatever its API exposes and `null` for everything else (the loader
 * then keeps the mock baseline / empty state for that part). Returning `null`
 * from the provider entirely means "nothing live — use mock/empty".
 *
 * Every section is wired to consume whatever real data any connected account
 * supplies; an unconnected/unsupported channel simply contributes `null`.
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
  /** Best posting windows derived from this account's real engagement, or null. */
  bestTimes: TimeSlot[] | null
  /** UTM/conversion attribution rows (GA4 + revenue), or null. */
  roi: RoiRow[] | null
  followers: FollowerProfile[] | null
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:00 ${period}`
}

/**
 * Derive best-time-to-post windows from REAL engagement samples — each sample is
 * a post's timestamp paired with the engagement it earned. Buckets by weekday +
 * hour, scores each window 0..100 relative to the strongest, and returns the top
 * few. Returns [] when there's no engagement history (→ empty section, no fake).
 */
export function computeBestTimes(
  samples: { at: string | number; weight: number }[],
  topN = 3
): TimeSlot[] {
  const buckets = new Map<string, { day: number; hour: number; weight: number }>()
  for (const s of samples) {
    const date = typeof s.at === 'number' ? new Date(s.at * 1000) : new Date(s.at)
    const t = date.getTime()
    if (Number.isNaN(t)) continue
    const day = date.getUTCDay()
    const hour = date.getUTCHours()
    const key = `${day}-${hour}`
    const b = buckets.get(key) ?? { day, hour, weight: 0 }
    b.weight += Math.max(s.weight, 0) + 1 // +1 so a post with zero engagement still counts as activity
    buckets.set(key, b)
  }
  const ranked = [...buckets.values()].sort((a, b) => b.weight - a.weight)
  if (!ranked.length) return []
  const max = ranked[0].weight
  return ranked.slice(0, topN).map((b) => ({
    day: DAY_NAMES[b.day],
    time: formatHour(b.hour),
    score: Math.max(1, Math.round((b.weight / max) * 100)),
  }))
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
