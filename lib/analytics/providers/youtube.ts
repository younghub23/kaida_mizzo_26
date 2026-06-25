// ============================================================================
// YOUTUBE ANALYTICS PROVIDER (infrastructure — activates when connected)
// ----------------------------------------------------------------------------
// Pulls real channel data via the YouTube Data API using a Google OAuth token
// stored by the YouTube connect flow (app/api/social/youtube/callback). YouTube
// reuses Google OAuth, so we refresh with the stored refresh_token the same way
// the GA4 provider does.
//
// Maps to:
//   • Followers KPI  — channel subscriberCount
//   • likes/comments — aggregated across recent uploads
//   • posts          — recent uploads with per-video stats
//   • bestTimes      — derived from real upload timestamps + engagement
// Needs the `https://www.googleapis.com/auth/youtube.readonly` scope.
// Every call is defensive: any failure yields null for that part — never fake.
// See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { logError } from '@/lib/log'
import type { MetricKey, PostRow } from '@/app/(dashboard)/analytics/mock-data'
import {
  overlayKpis,
  rate,
  fetchJson,
  computeBestTimes,
  type PlatformAnalytics,
  type ConnectedAccount,
} from '@/lib/analytics/providers/util'

const API = 'https://www.googleapis.com/youtube/v3'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

async function ensureToken(account: ConnectedAccount): Promise<string | null> {
  const expired =
    account.token_expires_at !== null && new Date(account.token_expires_at).getTime() < Date.now() + 60_000
  if (!expired) return account.access_token
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!account.refresh_token || !clientId || !clientSecret) return account.access_token
  try {
    const refreshed = await fetchJson<{ access_token?: string }>(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    return refreshed.access_token ?? account.access_token
  } catch (err) {
    logError('analytics/youtube', 'Token refresh failed', err)
    return account.access_token
  }
}

type ChannelResp = {
  items?: {
    statistics?: { subscriberCount?: string; viewCount?: string }
    contentDetails?: { relatedPlaylists?: { uploads?: string } }
  }[]
}
type PlaylistResp = {
  items?: { snippet?: { publishedAt?: string; title?: string; resourceId?: { videoId?: string } } }[]
}
type VideoStatsResp = {
  items?: { id?: string; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }[]
}

export async function fetchYouTube(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  try {
    const token = await ensureToken(account)
    if (!token) return null
    const auth = { Authorization: `Bearer ${token}` }

    const channel = await fetchJson<ChannelResp>(
      `${API}/channels?part=statistics,contentDetails&mine=true`,
      { headers: auth }
    )
    const ch = channel.items?.[0]
    if (!ch) return null

    const subscribers = Number(ch.statistics?.subscriberCount ?? 0)
    const uploads = ch.contentDetails?.relatedPlaylists?.uploads

    const posts: PostRow[] = []
    if (uploads) {
      const playlist = await fetchJson<PlaylistResp>(
        `${API}/playlistItems?part=snippet&maxResults=15&playlistId=${uploads}`,
        { headers: auth }
      )
      const items = playlist.items ?? []
      const ids = items.map((i) => i.snippet?.resourceId?.videoId).filter((v): v is string => !!v)
      const stats: Record<string, { views: number; likes: number; comments: number }> = {}
      if (ids.length) {
        const vids = await fetchJson<VideoStatsResp>(
          `${API}/videos?part=statistics&id=${ids.join(',')}`,
          { headers: auth }
        )
        for (const v of vids.items ?? []) {
          if (!v.id) continue
          stats[v.id] = {
            views: Number(v.statistics?.viewCount ?? 0),
            likes: Number(v.statistics?.likeCount ?? 0),
            comments: Number(v.statistics?.commentCount ?? 0),
          }
        }
      }
      for (const i of items) {
        const id = i.snippet?.resourceId?.videoId
        if (!id) continue
        const s = stats[id] ?? { views: 0, likes: 0, comments: 0 }
        const views = Math.max(s.views, 1)
        posts.push({
          id,
          platform: 'youtube',
          caption: i.snippet?.title?.slice(0, 120) ?? '(no title)',
          format: 'Video',
          postedAt: (i.snippet?.publishedAt ?? '').slice(0, 10),
          views,
          likes: s.likes,
          comments: s.comments,
          shares: 0, // YouTube Data API doesn't expose share counts
          engagementRate: rate(s.likes + s.comments, views),
        })
      }
    }

    const live: Partial<Record<MetricKey, number>> = {}
    if (subscribers) live.followers = subscribers
    if (posts.length) {
      live.likes = posts.reduce((s, p) => s + p.likes, 0)
      live.comments = posts.reduce((s, p) => s + p.comments, 0)
      const views = posts.reduce((s, p) => s + p.views, 0)
      live.reach = views
      live.impressions = views
      if (views) live.engagementRate = rate(live.likes + live.comments, views)
    }

    const kpis = overlayKpis('youtube', live)
    const bestTimes = computeBestTimes(
      posts.map((p) => ({ at: p.postedAt, weight: p.likes + p.comments }))
    )
    if (!kpis.length && !posts.length && !bestTimes.length) return null
    // trend/audience: YouTube Analytics API (separate scope) is left for later;
    // followers (roster) isn't exposed; roi comes from GA4.
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
    logError('analytics/youtube', 'YouTube live fetch failed; using fallback', err)
    return null
  }
}
