// ============================================================================
// GOOGLE ANALYTICS 4 (GA4) PROVIDER
// ----------------------------------------------------------------------------
// Pulls real web metrics via the GA4 Data API using the OAuth token stored by
// the Google connect flow (app/api/social/google/callback). GA4 access tokens
// expire in ~1h, so we refresh with the stored refresh_token when needed.
//
// GA4 is web analytics, so it maps to:
//   • core KPIs   — sessions / users / page views / engagement rate
//   • trend chart — daily sessions (engagement) + users (reach) over 30 days
//   • audience    — top countries, age brackets, gender, and an active-hours
//                   heatmap (day-of-week × hour)
// Post-level data doesn't apply, so `posts` is null. Every report is fetched
// independently and defensively: any failure yields null/empty for THAT part
// only — never fake data, never a broken page.
//
// Requires the `analytics.readonly` scope and a GA4 property. The first
// accessible property is used unless an explicit id is stored on the account
// (platform_user_id, e.g. "properties/123456789"). Age/gender need Google
// Signals enabled on the property; when it's off those simply come back empty.
// See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { logError } from '@/lib/log'
import type {
  MetricKey,
  TrendPoint,
  AudienceData,
  LocationStat,
  AgeStat,
  Heatmap,
} from '@/app/(dashboard)/analytics/mock-data'
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

type RunReport = {
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[]
}
type Rows = NonNullable<RunReport['rows']>

/** Run one GA4 report in isolation: returns its rows, or [] (logged) on failure. */
async function runReport(
  property: string,
  token: string,
  body: Record<string, unknown>,
  label: string
): Promise<Rows> {
  try {
    const report = await fetchJson<RunReport>(`${DATA_API}/${property}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return report.rows ?? []
  } catch (err) {
    logError('analytics/google', `${label} report failed`, err)
    return []
  }
}

const LAST_28: Record<string, unknown>[] = [{ startDate: '28daysAgo', endDate: 'today' }]

// ---- Core KPIs --------------------------------------------------------------
async function fetchKpis(property: string, token: string): Promise<ReturnType<typeof overlayKpis> | null> {
  const metricNames = ['screenPageViews', 'totalUsers', 'sessions', 'engagementRate']
  const rows = await runReport(
    property,
    token,
    { dateRanges: LAST_28, metrics: metricNames.map((name) => ({ name })) },
    'kpis'
  )
  const values = rows[0]?.metricValues?.map((m) => Number(m.value ?? 0)) ?? []
  if (values.length === 0) return null
  const [pageViews, users, sessions, engagementRate] = values

  const live: Partial<Record<MetricKey, number>> = {}
  if (pageViews) live.impressions = pageViews
  if (users) live.reach = users
  if (sessions) live.clicks = sessions
  if (engagementRate) live.engagementRate = Math.round(engagementRate * 1000) / 10 // GA4 returns a 0..1 ratio
  const kpis = overlayKpis('google', live)
  return kpis.length ? kpis : null
}

// ---- Trend (daily) ----------------------------------------------------------
async function fetchTrend(property: string, token: string): Promise<TrendPoint[] | null> {
  const rows = await runReport(
    property,
    token,
    {
      dateRanges: [{ startDate: '29daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    },
    'trend'
  )
  if (!rows.length) return null
  const trend: TrendPoint[] = rows.map((r) => {
    const d = r.dimensionValues?.[0]?.value ?? '' // YYYYMMDD
    const label = d.length === 8 ? `${Number(d.slice(4, 6))}/${Number(d.slice(6, 8))}` : d
    return {
      label,
      engagement: Number(r.metricValues?.[0]?.value ?? 0),
      reach: Number(r.metricValues?.[1]?.value ?? 0),
    }
  })
  return trend.length ? trend : null
}

// ---- Audience demographics --------------------------------------------------
const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HEATMAP_HOUR_LABELS = ['12a', '4a', '8a', '12p', '4p', '8p', '11p']

const AGE_LABEL: Record<string, string> = {
  '18-24': '18–24',
  '25-34': '25–34',
  '35-44': '35–44',
  '45-54': '45–54',
  '55-64': '55–64',
  '65+': '65+',
}

/** Turn dimension+activeUsers rows into percentage shares (optionally adding "Other"). */
function pcts<T>(rows: Rows, make: (label: string, pct: number) => T, topN: number, otherLabel?: string): T[] {
  const items = rows
    .map((r) => ({ label: r.dimensionValues?.[0]?.value ?? '', users: Number(r.metricValues?.[0]?.value ?? 0) }))
    .filter((i) => i.label && i.label !== '(not set)' && i.users > 0)
  const total = items.reduce((s, i) => s + i.users, 0)
  if (!total) return []
  items.sort((a, b) => b.users - a.users)
  const top = items.slice(0, topN)
  const out = top.map((i) => make(i.label, Math.round((i.users / total) * 100)))
  if (otherLabel) {
    const rest = total - top.reduce((s, i) => s + i.users, 0)
    if (rest > 0) out.push(make(otherLabel, Math.round((rest / total) * 100)))
  }
  return out
}

async function fetchAudience(property: string, token: string): Promise<AudienceData | null> {
  const [countryRows, ageRows, genderRows, hourRows] = await Promise.all([
    runReport(property, token, { dateRanges: LAST_28, dimensions: [{ name: 'country' }], metrics: [{ name: 'activeUsers' }], limit: '25' }, 'audience/country'),
    runReport(property, token, { dateRanges: LAST_28, dimensions: [{ name: 'userAgeBracket' }], metrics: [{ name: 'activeUsers' }] }, 'audience/age'),
    runReport(property, token, { dateRanges: LAST_28, dimensions: [{ name: 'userGender' }], metrics: [{ name: 'activeUsers' }] }, 'audience/gender'),
    runReport(property, token, { dateRanges: LAST_28, dimensions: [{ name: 'dayOfWeek' }, { name: 'hour' }], metrics: [{ name: 'activeUsers' }] }, 'audience/hours'),
  ])

  const locations: LocationStat[] = pcts(countryRows, (country, pct) => ({ country, pct }), 5, 'Other')

  const ageRanges: AgeStat[] = pcts(
    ageRows.filter((r) => AGE_LABEL[r.dimensionValues?.[0]?.value ?? '']),
    (label, pct) => ({ range: AGE_LABEL[label] ?? label, pct }),
    6
  )

  // Top gender among male/female (GA4 also returns "unknown").
  const genders = genderRows
    .map((r) => ({ label: r.dimensionValues?.[0]?.value ?? '', users: Number(r.metricValues?.[0]?.value ?? 0) }))
    .filter((g) => g.label === 'male' || g.label === 'female')
  const genderTotal = genders.reduce((s, g) => s + g.users, 0)
  const topG = genders.sort((a, b) => b.users - a.users)[0]
  const topGender =
    topG && genderTotal
      ? { label: topG.label === 'male' ? 'Male' : 'Female', pct: Math.round((topG.users / genderTotal) * 100) }
      : { label: '', pct: 0 }

  // Active-hours heatmap: 7 days (Mon..Sun) × 24 hours, normalized 0..100.
  const grid: number[][] = HEATMAP_DAYS.map(() => new Array(24).fill(0))
  let max = 0
  for (const r of hourRows) {
    const ga4Day = Number(r.dimensionValues?.[0]?.value ?? -1) // 0=Sun..6=Sat
    const hour = Number(r.dimensionValues?.[1]?.value ?? -1)
    const users = Number(r.metricValues?.[0]?.value ?? 0)
    if (ga4Day < 0 || ga4Day > 6 || hour < 0 || hour > 23) continue
    const row = (ga4Day + 6) % 7 // shift so Monday is row 0
    grid[row][hour] = users
    if (users > max) max = users
  }
  const values = max > 0 ? grid.map((row) => row.map((v) => Math.round((v / max) * 100))) : grid
  const heatmap: Heatmap = { days: HEATMAP_DAYS, hourLabels: HEATMAP_HOUR_LABELS, values }

  // Only return audience if GA4 gave us something real to show.
  const hasData = locations.length > 0 || ageRanges.length > 0 || topGender.label !== '' || max > 0
  if (!hasData) return null

  return {
    locations,
    ageRanges,
    topGender,
    heatmap,
    // GA4 has no follower concept, so the follower-growth chart stays empty
    // (the audience component hides that card when there's no data).
    followerSeries: [],
  }
}

type AccountSummaries = { accountSummaries?: { propertySummaries?: { property?: string }[] }[] }

export async function fetchGoogle(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  try {
    const token = await ensureToken(account)
    if (!token) return null

    // Resolve the GA4 property to query.
    let property = account.platform_user_id?.startsWith('properties/')
      ? account.platform_user_id
      : undefined
    if (!property) {
      const summaries = await fetchJson<AccountSummaries>(`${ADMIN_API}/accountSummaries`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      property = summaries.accountSummaries?.[0]?.propertySummaries?.[0]?.property
    }
    if (!property) return null

    // Each part is independent — partial data is fine, failures fall back to empty.
    const [kpis, trend, audience] = await Promise.all([
      fetchKpis(property, token),
      fetchTrend(property, token),
      fetchAudience(property, token),
    ])

    if (!kpis && !trend && !audience) return null
    return { kpis, posts: null, trend, audience, followers: null }
  } catch (err) {
    logError('analytics/google', 'Google live fetch failed; using fallback', err)
    return null
  }
}
