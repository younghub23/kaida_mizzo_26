// ============================================================================
// GOOGLE ANALYTICS 4 (GA4) PROVIDER
// ----------------------------------------------------------------------------
// Pulls real web metrics via the GA4 Data API using the OAuth token stored by
// the Google connect flow (app/api/social/google/callback). GA4 access tokens
// expire in ~1h, so we refresh with the stored refresh_token when needed.
//
// GA4 is web analytics (sessions / users / conversions / revenue), so it maps
// to the traffic-style KPIs (impressions≈page views, reach≈users, clicks≈
// sessions, engagementRate). Post-level data doesn't apply, so `posts` is null.
//
// Requires the `analytics.readonly` scope and a GA4 property. The first
// accessible property is used unless an explicit id is stored on the account
// (platform_user_id, e.g. "properties/123456789").
// See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { logError } from '@/lib/log'
import type { MetricKey } from '@/app/(dashboard)/analytics/mock-data'
import {
  overlayKpis,
  fetchJson,
  type PlatformAnalytics,
  type ConnectedAccount,
} from '@/lib/analytics/providers/util'

const ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta'
const DATA_API = 'https://analyticsdata.googleapis.com/v1beta'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

/** Ensure a usable access token, refreshing via refresh_token when expired. */
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
    logError('analytics/google', 'Token refresh failed', err)
    return account.access_token
  }
}

type AccountSummaries = { accountSummaries?: { propertySummaries?: { property?: string }[] }[] }
type RunReport = { rows?: { metricValues?: { value?: string }[] }[] }

export async function fetchGoogle(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  try {
    const token = await ensureToken(account)
    if (!token) return null
    const auth = { Authorization: `Bearer ${token}` }

    // Resolve the GA4 property to query.
    let property = account.platform_user_id?.startsWith('properties/')
      ? account.platform_user_id
      : undefined
    if (!property) {
      const summaries = await fetchJson<AccountSummaries>(`${ADMIN_API}/accountSummaries`, { headers: auth })
      property = summaries.accountSummaries?.[0]?.propertySummaries?.[0]?.property
    }
    if (!property) return null

    // Pull a 28-day metric snapshot. Metric order is preserved in the response.
    const metricNames = ['screenPageViews', 'totalUsers', 'sessions', 'engagementRate']
    const report = await fetchJson<RunReport>(`${DATA_API}/${property}:runReport`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        metrics: metricNames.map((name) => ({ name })),
      }),
    })

    const values = report.rows?.[0]?.metricValues?.map((m) => Number(m.value ?? 0)) ?? []
    if (values.length === 0) return null
    const [pageViews, users, sessions, engagementRate] = values

    const live: Partial<Record<MetricKey, number>> = {}
    if (pageViews) live.impressions = pageViews
    if (users) live.reach = users
    if (sessions) live.clicks = sessions
    if (engagementRate) live.engagementRate = Math.round(engagementRate * 1000) / 10 // GA4 returns a 0..1 ratio

    // GA4 is web analytics with no social follower concept, so there is no
    // follower list to contribute for cross-channel matching.
    return { kpis: overlayKpis('google', live), posts: null, followers: null }
  } catch (err) {
    logError('analytics/google', 'Google live fetch failed; using fallback', err)
    return null
  }
}
