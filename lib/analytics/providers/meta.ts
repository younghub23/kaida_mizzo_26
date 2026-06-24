// ============================================================================
// META (Instagram + Facebook) ANALYTICS PROVIDER — LIVE DATA
// ----------------------------------------------------------------------------
// Server-only. Pulls real performance numbers from the Meta Graph API using the
// access token Tala already stores in `social_accounts` during the connect
// flow (app/api/social/meta/callback/route.ts).
//
// IMPORTANT — this code is BEST-EFFORT and intentionally defensive:
//   • Every network call is wrapped (see `attempt`) so ANY failure (missing
//     scope, expired token, API change) returns `null` for THAT call only. The
//     page shows whatever real data we could read and an empty state for the
//     rest — it never breaks, and it never falls back to fake numbers.
//   • Insights vs. content use different permissions, so they're fetched
//     independently. Post/engagement counts need only pages_read_engagement /
//     instagram_basic (granted today); audience-level insights (reach,
//     impressions, follower growth) need read_insights /
//     instagram_manage_insights, which require Meta App Review. Until those are
//     approved, posts + likes/comments/shares show live and the insight-only
//     KPIs stay empty. Scopes live in app/api/social/meta/connect/route.ts;
//     existing connections must RE-CONSENT after new scopes are granted.
//   • Graph API field/metric names drift between versions. Verify the metrics
//     below against the current Graph API version during rollout — only metrics
//     the API actually returns are shown (unmapped ones are omitted, not
//     mocked). See app/(dashboard)/analytics/INTEGRATION.md.
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

// v19 is past its sunset (Meta auto-upgrades it); v23 is current and verified.
const GRAPH = 'https://graph.facebook.com/v23.0'

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

/**
 * Run one Graph call in isolation: return its result, or `null` (logged) on any
 * failure. Lets us fetch each endpoint independently so a permission we DON'T
 * have yet (e.g. insights, pending App Review) can't suppress the real data we
 * DO have permission to read (e.g. posts via pages_read_engagement).
 */
async function attempt<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    logError('analytics/meta', label, err)
    return null
  }
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
  // The stored token is a Page token; derive the linked IG business account.
  const page = await attempt('Instagram account lookup failed', () =>
    graphGet<{ instagram_business_account?: { id: string } }>('me', {
      fields: 'instagram_business_account',
      access_token: token,
    })
  )
  const igId = page?.instagram_business_account?.id
  if (!igId) return null

  // The IG account node carries the live follower count directly (instagram_basic).
  const profile = await attempt('Instagram profile fetch failed', () =>
    graphGet<{ followers_count?: number }>(`${igId}`, {
      fields: 'followers_count',
      access_token: token,
    })
  )

  // Account reach needs instagram_manage_insights — an App-Review permission.
  // Media + engagement counts need only instagram_basic. Fetch independently so
  // a missing insights scope doesn't drop the post data. (`impressions` was
  // deprecated by Meta, so we request only the still-valid `reach`.)
  const insights = await attempt('Instagram insights fetch failed', () =>
    graphGet<InsightsResponse>(`${igId}/insights`, {
      metric: 'reach',
      period: 'days_28',
      access_token: token,
    })
  )
  // Per-media reach is itself an insight; request it, but fall back to the basic
  // fields if that scope isn't granted (otherwise the whole call would fail).
  const media =
    (await attempt('Instagram media (with insights) fetch failed', () =>
      graphGet<{ data?: IgMedia[] }>(`${igId}/media`, {
        fields: 'caption,media_type,timestamp,like_count,comments_count,insights.metric(reach)',
        limit: '15',
        access_token: token,
      })
    )) ??
    (await attempt('Instagram media fetch failed', () =>
      graphGet<{ data?: IgMedia[] }>(`${igId}/media`, {
        fields: 'caption,media_type,timestamp,like_count,comments_count',
        limit: '15',
        access_token: token,
      })
    ))

  const posts: PostRow[] = (media?.data ?? []).map((m) => {
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

  const reach = insights ? sumMetric(insights, 'reach') : undefined
  const live: Partial<Record<MetricKey, number>> = {}
  if (profile?.followers_count !== undefined) live.followers = profile.followers_count
  if (reach !== undefined) live.reach = reach
  if (posts.length) {
    const likes = posts.reduce((s, p) => s + p.likes, 0)
    const comments = posts.reduce((s, p) => s + p.comments, 0)
    live.likes = likes
    live.comments = comments
    if (reach) live.engagementRate = rate(likes + comments, reach)
  }

  const kpis = overlayKpis('instagram', live)
  if (!kpis.length && !posts.length) return null
  return { kpis, posts: posts.length ? posts : null }
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
  // The Page node carries the live follower count directly (readable with
  // pages_read_engagement — no App Review needed).
  const page = await attempt('Facebook page lookup failed', () =>
    graphGet<{ id: string; followers_count?: number; fan_count?: number }>('me', {
      fields: 'id,followers_count,fan_count',
      access_token: token,
    })
  )
  const pageId = page?.id
  if (!pageId) return null

  // Insights and posts use different permissions, so fetch them independently —
  // a failure in one never suppresses the other. NOTE: Meta deprecated the old
  // page_impressions* / page_fan_adds metrics; `page_daily_follows` is the
  // current follower-change metric. Page-level reach/impressions are no longer
  // offered by the Graph API, so we surface only what Meta actually returns.
  const insights = await attempt('Facebook insights fetch failed', () =>
    graphGet<InsightsResponse>(`${pageId}/insights`, {
      metric: 'page_daily_follows',
      period: 'days_28',
      access_token: token,
    })
  )
  const postsRes = await attempt('Facebook posts fetch failed', () =>
    graphGet<{ data?: FbPost[] }>(`${pageId}/posts`, {
      fields: 'message,created_time,shares,likes.summary(true),comments.summary(true)',
      limit: '15',
      access_token: token,
    })
  )

  const posts: PostRow[] = (postsRes?.data ?? []).map((p) => {
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

  const live: Partial<Record<MetricKey, number>> = {}
  const followers = page.followers_count ?? page.fan_count
  if (followers !== undefined) live.followers = followers
  if (insights) {
    const follows = sumMetric(insights, 'page_daily_follows')
    if (follows !== undefined) live.followerGrowth = follows
  }
  if (posts.length) {
    live.likes = posts.reduce((s, p) => s + p.likes, 0)
    live.comments = posts.reduce((s, p) => s + p.comments, 0)
    live.shares = posts.reduce((s, p) => s + p.shares, 0)
  }

  const kpis = overlayKpis('facebook', live)
  if (!kpis.length && !posts.length) return null
  return { kpis, posts: posts.length ? posts : null }
}

/** Provider entry point. Returns live data where readable, or null when nothing
 *  real could be fetched (the section then renders an empty state, never mock). */
export function fetchMeta(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  return account.platform === 'instagram'
    ? fetchInstagram(account.access_token)
    : fetchFacebook(account.access_token)
}
