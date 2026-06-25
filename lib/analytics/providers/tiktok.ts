// ============================================================================
// TIKTOK ANALYTICS PROVIDER (infrastructure — not yet integrated)
// ----------------------------------------------------------------------------
// Wired into the loader so it activates automatically once analytics scopes are
// granted. Today the connect flow only requests user.info.basic / video.publish
// / video.upload, so these calls fail and the page falls back to mock (dev) /
// empty (prod) — intended for now.
//
// To integrate later, add scopes `user.info.stats` and `video.list` to the
// TikTok connect route, and ensure tokens are refreshed (they expire in ~24h;
// refresh_token is stored on social_accounts).
// See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { logError } from '@/lib/log'
import type { MetricKey, PostRow } from '@/app/(dashboard)/analytics/mock-data'
import {
  overlayKpis,
  rate,
  fetchJson,
  type PlatformAnalytics,
  type ConnectedAccount,
} from '@/lib/analytics/providers/util'

const API = 'https://open.tiktokapis.com/v2'

type UserInfo = {
  data?: { user?: { follower_count?: number; likes_count?: number; video_count?: number } }
  error?: { code?: string }
}
type Video = {
  id: string
  title?: string
  like_count?: number
  comment_count?: number
  share_count?: number
  view_count?: number
  create_time?: number
}
type VideoList = { data?: { videos?: Video[] }; error?: { code?: string } }

export async function fetchTikTok(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  const token = account.access_token
  try {
    const auth = { Authorization: `Bearer ${token}` }

    // Account stats (needs user.info.stats scope).
    const info = await fetchJson<UserInfo>(
      `${API}/user/info/?fields=follower_count,likes_count,video_count`,
      { headers: auth }
    )
    if (info.error && info.error.code !== 'ok') return null

    // Recent videos with per-video metrics (needs video.list scope).
    const list = await fetchJson<VideoList>(
      `${API}/video/list/?fields=id,title,like_count,comment_count,share_count,view_count,create_time`,
      { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ max_count: 20 }) }
    )

    const videos = list.data?.videos ?? []
    const posts: PostRow[] = videos.map((v) => {
      const likes = v.like_count ?? 0
      const comments = v.comment_count ?? 0
      const shares = v.share_count ?? 0
      const views = Math.max(v.view_count ?? 0, 1)
      return {
        id: v.id,
        platform: 'tiktok',
        caption: v.title?.slice(0, 120) || '(no caption)',
        format: 'Video',
        postedAt: v.create_time ? new Date(v.create_time * 1000).toISOString().slice(0, 10) : '',
        views,
        likes,
        comments,
        shares,
        engagementRate: rate(likes + comments + shares, views),
      }
    })

    const live: Partial<Record<MetricKey, number>> = {}
    if (info.data?.user?.follower_count !== undefined) live.followers = info.data.user.follower_count
    if (videos.length) {
      const totalViews = videos.reduce((s, v) => s + (v.view_count ?? 0), 0)
      const likes = videos.reduce((s, v) => s + (v.like_count ?? 0), 0)
      const comments = videos.reduce((s, v) => s + (v.comment_count ?? 0), 0)
      const shares = videos.reduce((s, v) => s + (v.share_count ?? 0), 0)
      live.reach = totalViews
      live.impressions = totalViews
      live.likes = likes
      live.comments = comments
      live.shares = shares
      live.engagementRate = rate(likes + comments + shares, totalViews)
    }

    // trend/audience: TikTok's time-series + audience endpoints are left for
    // later; followers: the API exposes a follower count, not a roster.
    return { kpis: overlayKpis('tiktok', live), posts: posts.length ? posts : null, trend: null, audience: null, followers: null }
  } catch (err) {
    logError('analytics/tiktok', 'TikTok live fetch failed; using fallback', err)
    return null
  }
}
