// ============================================================================
// LINKEDIN ANALYTICS PROVIDER (infrastructure — not yet integrated)
// ----------------------------------------------------------------------------
// Wired into the loader so it activates automatically once an Organization with
// the right scopes is connected. Today the connect flow only requests member
// scopes (openid, profile, w_member_social), so these calls will fail and the
// page falls back to mock (dev) / empty (prod) — which is intended for now.
//
// To integrate later you need LinkedIn Marketing Developer Platform access and
// organization scopes: `r_organization_social` (+ `rw_organization_admin` to
// discover administered orgs). See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { logError } from '@/lib/log'
import type { MetricKey } from '@/app/(dashboard)/analytics/mock-data'
import {
  overlayKpis,
  rate,
  fetchJson,
  type PlatformAnalytics,
  type ConnectedAccount,
} from '@/lib/analytics/providers/util'

const API = 'https://api.linkedin.com'
const REST_VERSION = '202405'

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': REST_VERSION,
  }
}

type AclResponse = { elements?: { organizationalTarget?: string }[] }
type ShareStats = {
  elements?: {
    totalShareStatistics?: {
      impressionCount?: number
      clickCount?: number
      likeCount?: number
      commentCount?: number
      shareCount?: number
      engagement?: number
    }
  }[]
}

export async function fetchLinkedIn(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  const token = account.access_token
  try {
    // 1. Find an organization the member administers (needs org admin scope).
    const acls = await fetchJson<AclResponse>(
      `${API}/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget))`,
      { headers: headers(token) }
    )
    const orgUrn = acls.elements?.[0]?.organizationalTarget
    if (!orgUrn) return null

    // 2. Organization share statistics (needs r_organization_social).
    const stats = await fetchJson<ShareStats>(
      `${API}/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(orgUrn)}`,
      { headers: headers(token) }
    )
    const totals = stats.elements?.[0]?.totalShareStatistics
    if (!totals) return null

    const live: Partial<Record<MetricKey, number>> = {}
    if (totals.impressionCount !== undefined) {
      live.impressions = totals.impressionCount
      live.reach = totals.impressionCount // LinkedIn exposes impressions, not unique reach
    }
    if (totals.clickCount !== undefined) live.clicks = totals.clickCount
    if (totals.likeCount !== undefined) live.likes = totals.likeCount
    if (totals.commentCount !== undefined) live.comments = totals.commentCount
    if (totals.shareCount !== undefined) live.shares = totals.shareCount
    if (totals.engagement !== undefined) {
      live.engagementRate = Math.round(totals.engagement * 1000) / 10
    } else if (totals.impressionCount) {
      const interactions =
        (totals.likeCount ?? 0) + (totals.commentCount ?? 0) + (totals.shareCount ?? 0)
      live.engagementRate = rate(interactions, totals.impressionCount)
    }

    // Post-level org analytics (ugcPosts + per-share stats) — and the best-times,
    // trend, audience and ROI they'd feed — are left for later; followers:
    // LinkedIn exposes aggregate demographics, not a roster.
    return {
      kpis: overlayKpis('linkedin', live),
      posts: null,
      trend: null,
      audience: null,
      bestTimes: null,
      roi: null,
      followers: null,
    }
  } catch (err) {
    logError('analytics/linkedin', 'LinkedIn live fetch failed; using fallback', err)
    return null
  }
}
