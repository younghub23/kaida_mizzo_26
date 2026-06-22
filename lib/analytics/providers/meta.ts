// ============================================================================
// META (Instagram + Facebook) ANALYTICS PROVIDER — LIVE DATA
// ----------------------------------------------------------------------------
// Server-only. Pulls real performance numbers from the Meta Graph API using the
// access token Tala already stores in `social_accounts` during the connect
// flow (app/api/social/meta/callback/route.ts).
//
// IMPORTANT — this code is BEST-EFFORT and intentionally defensive:
//   • Every network call is wrapped so ANY failure (missing scope, expired
//     token, API change) returns `null` and the caller falls back to mock data.
//     The analytics page must never break because a fetch failed.
//   • Reading insights requires elevated permissions that need Meta App Review
//     before they work in production:
//       Instagram: instagram_basic, instagram_manage_insights
//       Facebook:  pages_read_engagement, read_insights
//     These are added to the connect scopes in
//     app/api/social/meta/connect/route.ts, but existing connections must
//     RE-CONSENT before live data flows.
//   • Graph API field/metric names drift between versions. Verify the metrics
//     below against the current Graph API version during rollout — until then,
//     unmapped KPIs keep their mock value (we override only what the API
//     actually returns). See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { logError } from '@/lib/log'
import {
  type MetricKey,
  type PostRow,
  type PostFormat,
} from '@/app/(dashboard)/analytics/mock-data'
import {
  overlayKpis,
  rate,
  type PlatformAnalytics,
  type ConnectedAccount,
} from '@/lib/analytics/providers/util'

const GRAPH = 'https://graph.facebook.com/v19.0'

type InsightsResponse = { data?: { name: string; values?: { value: number }[] }[] }

/** Thin Graph GET that throws on any API/transport error. */
async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { cache: 'no-store' })
  const json = (await res.json()) as T & { error?: { message?: string } }
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Graph API error ${res.status}`)
  }
  return json
}

/** Sum the values array a Graph insights metric returns (period totals). */
function sumMetric(insights: InsightsResponse, name: string): number | undefined {
  const metric = insights.data?.find((m) => m.name === name)
  if (!metric?.values?.length) return undefined
  return metric.values.reduce((s, v) => s + (v.value ?? 0), 0)
}

function igFormat(mediaType?: string): PostFormat {
  switch (mediaType) {
    case 'VIDEO':
      return 'Video'
    case 'CAROUSEL_ALBUM':
      return 'Carousel'
    default:
      return 'Image'
  }
}

type IgMedia = {
  id: string
  caption?: string
  media_type?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
  insights?: { data?: { values?: { value: number }[] }[] }
}

async function fetchInstagram(token: string): Promise<PlatformAnalytics | null> {
  try {
    // The stored token is a Page token; derive the linked IG business account.
    const page = await graphGet<{ instagram_business_account?: { id: string } }>('me', {
      fields: 'instagram_business_account',
      access_token: token,
    })
    const igId = page.instagram_business_account?.id
    if (!igId) return null

    const [insights, media] = await Promise.all([
      graphGet<InsightsResponse>(`${igId}/insights`, {
        metric: 'reach,impressions',
        period: 'days_28',
        access_token: token,
      }),
      graphGet<{ data?: IgMedia[] }>(`${igId}/media`, {
        fields: 'caption,media_type,timestamp,like_count,comments_count,insights.metric(reach)',
        limit: '15',
        access_token: token,
      }),
    ])

    const posts: PostRow[] = (media.data ?? []).map((m) => {
      const likes = m.like_count ?? 0
      const comments = m.comments_count ?? 0
      const reach = m.insights?.data?.[0]?.values?.[0]?.value ?? likes + comments
      const views = Math.max(reach, 1)
      return {
        id: m.id,
        platform: 'instagram',
        caption: m.caption?.slice(0, 120) ?? '(no caption)',
        format: igFormat(m.media_type),
        postedAt: (m.timestamp ?? '').slice(0, 10),
        views,
        likes,
        comments,
        shares: 0, // IG does not expose share counts via the Graph API
        engagementRate: rate(likes + comments, views),
      }
    })

    const reach = sumMetric(insights, 'reach')
    const impressions = sumMetric(insights, 'impressions')
    const likes = posts.reduce((s, p) => s + p.likes, 0)
    const comments = posts.reduce((s, p) => s + p.comments, 0)
    const live: Partial<Record<MetricKey, number>> = {}
    if (reach !== undefined) live.reach = reach
    if (impressions !== undefined) live.impressions = impressions
    if (posts.length) {
      live.likes = likes
      live.comments = comments
      if (reach) live.engagementRate = rate(likes + comments, reach)
    }

    return { kpis: overlayKpis('instagram', live), posts: posts.length ? posts : null }
  } catch (err) {
    logError('analytics/meta', 'Instagram live fetch failed; using mock', err)
    return null
  }
}

type FbPost = {
  id: string
  message?: string
  created_time?: string
  shares?: { count?: number }
  likes?: { summary?: { total_count?: number } }
  comments?: { summary?: { total_count?: number } }
}

async function fetchFacebook(token: string): Promise<PlatformAnalytics | null> {
  try {
    const page = await graphGet<{ id: string }>('me', { fields: 'id', access_token: token })
    const pageId = page.id

    const [insights, postsRes] = await Promise.all([
      graphGet<InsightsResponse>(`${pageId}/insights`, {
        metric: 'page_impressions,page_impressions_unique,page_fan_adds,page_post_engagements',
        period: 'days_28',
        access_token: token,
      }),
      graphGet<{ data?: FbPost[] }>(`${pageId}/posts`, {
        fields: 'message,created_time,shares,likes.summary(true),comments.summary(true)',
        limit: '15',
        access_token: token,
      }),
    ])

    const posts: PostRow[] = (postsRes.data ?? []).map((p) => {
      const likes = p.likes?.summary?.total_count ?? 0
      const comments = p.comments?.summary?.total_count ?? 0
      const shares = p.shares?.count ?? 0
      const views = Math.max(likes + comments + shares, 1) // page-post reach needs a per-post call; proxy for now
      return {
        id: p.id,
        platform: 'facebook',
        caption: p.message?.slice(0, 120) ?? '(no caption)',
        format: 'Text',
        postedAt: (p.created_time ?? '').slice(0, 10),
        views,
        likes,
        comments,
        shares,
        engagementRate: rate(likes + comments + shares, views),
      }
    })

    const reach = sumMetric(insights, 'page_impressions_unique')
    const impressions = sumMetric(insights, 'page_impressions')
    const fanAdds = sumMetric(insights, 'page_fan_adds')
    const engagements = sumMetric(insights, 'page_post_engagements')
    const live: Partial<Record<MetricKey, number>> = {}
    if (reach !== undefined) live.reach = reach
    if (impressions !== undefined) live.impressions = impressions
    if (fanAdds !== undefined) live.followerGrowth = fanAdds
    if (posts.length) {
      live.likes = posts.reduce((s, p) => s + p.likes, 0)
      live.comments = posts.reduce((s, p) => s + p.comments, 0)
      live.shares = posts.reduce((s, p) => s + p.shares, 0)
    }
    if (engagements !== undefined && reach) live.engagementRate = rate(engagements, reach)

    return { kpis: overlayKpis('facebook', live), posts: posts.length ? posts : null }
  } catch (err) {
    logError('analytics/meta', 'Facebook live fetch failed; using mock', err)
    return null
  }
}

/** Provider entry point. Returns null on any failure so the caller falls back to mock. */
export function fetchMeta(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  return account.platform === 'instagram'
    ? fetchInstagram(account.access_token)
    : fetchFacebook(account.access_token)
}
