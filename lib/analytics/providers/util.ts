// Shared helpers for the live analytics providers (Meta, LinkedIn, TikTok,
// Google). Server-only — these are imported solely by lib/analytics/load.ts.

import {
  getCoreMetrics,
  type Kpi,
  type MetricKey,
  type PostRow,
  type RealNetwork,
} from '@/app/(dashboard)/analytics/mock-data'
import type { FollowerProfile } from '@/lib/analytics/cross-channel'

/**
 * Per-platform live result. Each part is independent: a provider returns live
 * `kpis`, `posts`, and/or `followers`, and `null` for whatever it couldn't
 * fetch live (the loader then keeps the baseline for that part). Returning
 * `null` from the provider entirely means "nothing live — use baseline".
 *
 * `followers` is the platform's follower roster (handle + name + bio), used to
 * reconcile the same person across networks (see lib/analytics/cross-channel.ts
 * and the cross-channel section). Most platform APIs do NOT expose follower
 * rosters with profile details, so providers return `null` here until a real
 * follower source is connected — exactly the scaffolded pattern the KPI
 * providers use.
 */
export type PlatformAnalytics = {
  kpis: Kpi[] | null
  posts: PostRow[] | null
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
 * Start from the mock KPI baseline for a platform and override ONLY the metrics
 * the live API actually returned, so the KPI card set stays complete while
 * surfacing as much real data as possible. deltaPct stays mock (we don't
 * compute period-over-period here yet).
 */
export function overlayKpis(
  platform: RealNetwork,
  live: Partial<Record<MetricKey, number>>
): Kpi[] {
  return getCoreMetrics(platform).map((k) =>
    live[k.key] !== undefined ? { ...k, value: Math.round(live[k.key]! * 10) / 10 } : k
  )
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
