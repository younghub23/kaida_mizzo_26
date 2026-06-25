// ============================================================================
// PINTEREST ANALYTICS PROVIDER (infrastructure — activates when connected)
// ----------------------------------------------------------------------------
// Pulls real data via the Pinterest API v5 using the OAuth token stored by the
// Pinterest connect flow (app/api/social/pinterest/callback).
//
// Maps to:
//   • Followers KPI       — user_account.follower_count
//   • reach/impressions   — user_account.monthly_views
//   • posts               — recent pins (title + created_at)
//   • bestTimes           — derived from real pin timestamps
// Needs scopes `user_accounts:read` + `pins:read`. Per-pin engagement requires
// the pin analytics endpoint (date-ranged) and is left for later. Every call is
// defensive: any failure yields null for that part — never fake.
// See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { logError } from '@/lib/log'
import type { MetricKey, PostRow } from '@/app/(dashboard)/analytics/mock-data'
import {
  overlayKpis,
  fetchJson,
  computeBestTimes,
  type PlatformAnalytics,
  type ConnectedAccount,
} from '@/lib/analytics/providers/util'

const API = 'https://api.pinterest.com/v5'

type UserAccount = { follower_count?: number; monthly_views?: number }
type Pin = { id: string; title?: string; description?: string; created_at?: string }
type PinList = { items?: Pin[] }

export async function fetchPinterest(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  try {
    const auth = { Authorization: `Bearer ${account.access_token}` }

    const [profile, pinList] = await Promise.all([
      fetchJson<UserAccount>(`${API}/user_account`, { headers: auth }).catch(() => null),
      fetchJson<PinList>(`${API}/pins?page_size=25`, { headers: auth }).catch(() => null),
    ])

    const posts: PostRow[] = (pinList?.items ?? []).map((p) => ({
      id: p.id,
      platform: 'pinterest' as const,
      caption: (p.title || p.description || '(no title)').slice(0, 120),
      format: 'Image' as const,
      postedAt: (p.created_at ?? '').slice(0, 10),
      views: 1, // per-pin reach needs the pin analytics endpoint; unknown here
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
    }))

    const live: Partial<Record<MetricKey, number>> = {}
    if (profile?.follower_count !== undefined) live.followers = profile.follower_count
    if (profile?.monthly_views !== undefined) {
      live.reach = profile.monthly_views
      live.impressions = profile.monthly_views
    }

    const kpis = overlayKpis('pinterest', live)
    const bestTimes = computeBestTimes(posts.map((p) => ({ at: p.postedAt, weight: 0 })))
    if (!kpis.length && !posts.length && !bestTimes.length) return null
    // trend/audience: Pinterest analytics endpoints are left for later; roi via
    // GA4; followers (roster) isn't exposed.
    return {
      kpis,
      posts: posts.length ? posts : null,
      trend: null,
      audience: null,
      bestTimes: bestTimes.length ? bestTimes : null,
      roi: null,
      followers: null,
    }
  } catch (err) {
    logError('analytics/pinterest', 'Pinterest live fetch failed; using fallback', err)
    return null
  }
}
