// ============================================================================
// CENTRALIZED MOCK DATA — Tala Analytics dashboard
// ----------------------------------------------------------------------------
// EVERYTHING the analytics page displays comes from this file. It is ALL
// placeholder data — Tala has no live social integrations yet.
//
// HOW TO READ THIS FILE
//   • Each dataset carries a `// SOURCE:` comment naming the EVENTUAL real
//     source (Meta Graph API, scheduled_posts table, Claude model, etc.).
//   • The UI never reads raw literals directly — it calls the small `get*()`
//     accessors at the bottom. To wire up real data later, replace the body of
//     an accessor with a real query; the components don't change.
//   • Datasets that can plausibly be derived from the EXISTING Supabase
//     `scheduled_posts` table say so — those are the easiest to wire up first.
//
// Determinism note: this file uses NO Math.random() / Date.now(). All variation
// is seeded so server-rendered HTML matches client hydration.
// ============================================================================

// ----------------------------------------------------------------------------
// Networks (drives the cross-network unified-reporting filter)
// ----------------------------------------------------------------------------
export type Network =
  | 'all'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'google'

export type RealNetwork = Exclude<Network, 'all'>

export const NETWORKS: { id: Network; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'google', label: 'Google' },
]

export const REAL_NETWORKS: RealNetwork[] = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'google',
]

// Share of total volume each network contributes (sums to 1.0). Used to split
// the aggregate "All" numbers into believable per-network values.
const NETWORK_WEIGHT: Record<RealNetwork, number> = {
  instagram: 0.34,
  facebook: 0.22,
  linkedin: 0.14,
  tiktok: 0.24,
  google: 0.06,
}

// Per-network bias applied to period-over-period deltas so the filter feels
// alive (some networks trending up harder than others).
const NETWORK_DELTA_BIAS: Record<RealNetwork, number> = {
  instagram: 2,
  facebook: -3,
  linkedin: 1,
  tiktok: 5,
  google: -4,
}

// Deterministic PRNG (LCG) so per-network generated series are stable.
function seeded(seed: number): () => number {
  let s = (seed >>> 0) || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function networkSeed(network: Network): number {
  const idx = NETWORKS.findIndex((n) => n.id === network)
  return (idx + 1) * 97
}

// ----------------------------------------------------------------------------
// 1. CORE PERFORMANCE METRICS — top-level KPI cards
// SOURCE: Meta Graph API /insights, LinkedIn Marketing API, TikTok Display API,
// and Google Analytics — unified across connected accounts. Engagement counts
// (likes/comments/shares) can be partially derived from the existing Supabase
// `scheduled_posts` table once publishing writes engagement back.
// ----------------------------------------------------------------------------
export type MetricKey =
  | 'engagementRate'
  | 'followers'
  | 'reach'
  | 'followerGrowth'
  | 'impressions'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'clicks'

export type Kpi = {
  key: MetricKey
  label: string
  value: number
  format: 'percent' | 'number'
  // Period-over-period change. `null` when there's no real comparison to show
  // (live data — we don't compute real period-over-period yet), so the UI can
  // omit the "vs last period" line rather than render a fabricated delta.
  deltaPct: number | null
}

type KpiSpec = {
  label: string
  format: 'percent' | 'number'
  value: number // value for the aggregate "All" view
  deltaPct: number
  additive: boolean // true => split across networks by weight; false => rate
}

const BASE_KPIS: Record<MetricKey, KpiSpec> = {
  engagementRate: { label: 'Engagement rate', format: 'percent', value: 4.8, deltaPct: 12.4, additive: false },
  followers: { label: 'Followers', format: 'number', value: 24_800, deltaPct: 3.4, additive: true },
  reach: { label: 'Reach', format: 'number', value: 184_200, deltaPct: 8.1, additive: true },
  followerGrowth: { label: 'Follower growth', format: 'number', value: 3_240, deltaPct: 18.6, additive: true },
  impressions: { label: 'Impressions', format: 'number', value: 412_800, deltaPct: 5.3, additive: true },
  likes: { label: 'Likes', format: 'number', value: 28_940, deltaPct: 9.7, additive: true },
  comments: { label: 'Comments', format: 'number', value: 3_120, deltaPct: -2.4, additive: true },
  shares: { label: 'Shares', format: 'number', value: 1_860, deltaPct: 14.2, additive: true },
  clicks: { label: 'Clicks', format: 'number', value: 9_450, deltaPct: 6.8, additive: true },
}

// Per-network engagement rate (a rate can't be split by weight).
const NETWORK_ENGAGEMENT_RATE: Record<RealNetwork, number> = {
  instagram: 5.6,
  facebook: 3.2,
  linkedin: 4.1,
  tiktok: 7.3,
  google: 1.9,
}

// ----------------------------------------------------------------------------
// 1b. TREND CHART — daily engagement & reach over the last 30 days
// SOURCE: Meta Graph API /insights time series + scheduled_posts publish dates.
// ----------------------------------------------------------------------------
export type TrendPoint = { label: string; engagement: number; reach: number }

const END_DATE = new Date('2026-06-22T00:00:00Z') // fixed reference for determinism

function lastNDateLabels(n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(END_DATE)
    d.setUTCDate(d.getUTCDate() - i)
    out.push(`${d.getUTCMonth() + 1}/${d.getUTCDate()}`)
  }
  return out
}

// ----------------------------------------------------------------------------
// 2. CONTENT / POST-LEVEL PERFORMANCE
// SOURCE: Supabase `scheduled_posts` (caption=content, platforms, scheduled_at,
// image_url=format hint) JOINED with per-post insights from each network's API
// (views/likes/comments/shares). The post list itself is already live data.
// ----------------------------------------------------------------------------
export type PostFormat = 'Image' | 'Carousel' | 'Reel' | 'Video' | 'Story' | 'Text' | 'Link'

export type PostRow = {
  id: string
  platform: RealNetwork
  caption: string
  format: PostFormat
  postedAt: string // YYYY-MM-DD
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
}

const POSTS: PostRow[] = [
  { id: 'p1', platform: 'instagram', caption: '5 quick wins for your spring launch ✨', format: 'Carousel', postedAt: '2026-06-18', views: 24_100, likes: 1_980, comments: 214, shares: 162, engagementRate: 9.8 },
  { id: 'p2', platform: 'tiktok', caption: 'POV: marketing made simple', format: 'Reel', postedAt: '2026-06-17', views: 88_400, likes: 7_240, comments: 612, shares: 1_140, engagementRate: 10.2 },
  { id: 'p3', platform: 'linkedin', caption: 'How we cut email churn by 22% this quarter', format: 'Text', postedAt: '2026-06-16', views: 12_300, likes: 540, comments: 96, shares: 71, engagementRate: 5.7 },
  { id: 'p4', platform: 'facebook', caption: 'Customer spotlight: Bloom & Co bakery', format: 'Image', postedAt: '2026-06-15', views: 9_870, likes: 410, comments: 38, shares: 22, engagementRate: 4.8 },
  { id: 'p5', platform: 'instagram', caption: 'Behind the scenes of our content studio', format: 'Story', postedAt: '2026-06-14', views: 6_540, likes: 290, comments: 12, shares: 9, engagementRate: 4.7 },
  { id: 'p6', platform: 'instagram', caption: 'New feature drop: AI captions in one tap', format: 'Reel', postedAt: '2026-06-13', views: 41_200, likes: 3_410, comments: 388, shares: 502, engagementRate: 10.4 },
  { id: 'p7', platform: 'tiktok', caption: '3 hooks that stop the scroll', format: 'Video', postedAt: '2026-06-12', views: 52_900, likes: 4_120, comments: 301, shares: 690, engagementRate: 9.7 },
  { id: 'p8', platform: 'linkedin', caption: 'The creator economy in 2026: our take', format: 'Link', postedAt: '2026-06-11', views: 8_900, likes: 312, comments: 54, shares: 40, engagementRate: 4.6 },
  { id: 'p9', platform: 'facebook', caption: 'Weekend sale — 20% off all plans', format: 'Image', postedAt: '2026-06-10', views: 14_600, likes: 620, comments: 71, shares: 58, engagementRate: 5.1 },
  { id: 'p10', platform: 'google', caption: 'Search ad: small business marketing suite', format: 'Link', postedAt: '2026-06-09', views: 31_400, likes: 0, comments: 0, shares: 0, engagementRate: 3.2 },
  { id: 'p11', platform: 'instagram', caption: 'Carousel: 7 caption formulas that convert', format: 'Carousel', postedAt: '2026-06-08', views: 19_800, likes: 1_540, comments: 176, shares: 140, engagementRate: 9.4 },
  { id: 'p12', platform: 'tiktok', caption: 'Day in the life of a solo founder', format: 'Reel', postedAt: '2026-06-07', views: 67_200, likes: 5_310, comments: 488, shares: 902, engagementRate: 10.0 },
  { id: 'p13', platform: 'linkedin', caption: 'Hiring: senior brand designer (remote)', format: 'Text', postedAt: '2026-06-06', views: 6_700, likes: 198, comments: 33, shares: 19, engagementRate: 3.7 },
  { id: 'p14', platform: 'facebook', caption: 'Live Q&A recap + your top questions', format: 'Video', postedAt: '2026-06-05', views: 11_200, likes: 388, comments: 62, shares: 31, engagementRate: 4.3 },
]

// ----------------------------------------------------------------------------
// 3. AUDIENCE INSIGHTS — demographics, active-hours heatmap, follower growth
// SOURCE: Meta Graph API /insights (audience_*), LinkedIn demographics,
// TikTok audience analytics. No equivalent in scheduled_posts — needs live APIs.
// ----------------------------------------------------------------------------
export type LocationStat = { country: string; pct: number }
export type AgeStat = { range: string; pct: number }

export type Heatmap = {
  days: string[] // row labels (Mon..Sun)
  hourLabels: string[] // a few column markers
  values: number[][] // [day][hour] intensity 0..100
}

export type AudienceData = {
  locations: LocationStat[]
  ageRanges: AgeStat[]
  topGender: { label: string; pct: number }
  heatmap: Heatmap
  followerSeries: { label: string; value: number }[] // monthly totals
}

const AUDIENCE_LOCATIONS: LocationStat[] = [
  { country: 'United States', pct: 42 },
  { country: 'United Kingdom', pct: 16 },
  { country: 'Canada', pct: 11 },
  { country: 'Australia', pct: 9 },
  { country: 'Germany', pct: 7 },
  { country: 'Other', pct: 15 },
]

const AUDIENCE_AGES: AgeStat[] = [
  { range: '18–24', pct: 22 },
  { range: '25–34', pct: 38 },
  { range: '35–44', pct: 24 },
  { range: '45–54', pct: 11 },
  { range: '55+', pct: 5 },
]

const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HEATMAP_HOUR_LABELS = ['12a', '4a', '8a', '12p', '4p', '8p', '11p']

// ----------------------------------------------------------------------------
// 4. BEST-TIME-TO-POST — Claude-powered recommended posting windows
// SOURCE: Claude best-time model (lib/anthropic.ts) run over the engagement
// history of the Supabase `scheduled_posts` table per platform.
// ----------------------------------------------------------------------------
export type TimeSlot = { day: string; time: string; score: number } // score 0..100

const BEST_TIMES_ALL: TimeSlot[] = [
  { day: 'Tue', time: '11:00 AM', score: 96 },
  { day: 'Thu', time: '7:00 PM', score: 92 },
  { day: 'Wed', time: '1:00 PM', score: 88 },
  { day: 'Sat', time: '10:00 AM', score: 81 },
]

const BEST_TIMES_BY_NETWORK: Record<RealNetwork, TimeSlot[]> = {
  instagram: [
    { day: 'Wed', time: '12:00 PM', score: 97 },
    { day: 'Fri', time: '6:00 PM', score: 90 },
    { day: 'Sun', time: '9:00 AM', score: 84 },
  ],
  facebook: [
    { day: 'Thu', time: '1:00 PM', score: 89 },
    { day: 'Tue', time: '9:00 AM', score: 82 },
    { day: 'Sat', time: '11:00 AM', score: 76 },
  ],
  linkedin: [
    { day: 'Tue', time: '8:00 AM', score: 95 },
    { day: 'Wed', time: '12:00 PM', score: 91 },
    { day: 'Thu', time: '5:00 PM', score: 83 },
  ],
  tiktok: [
    { day: 'Fri', time: '7:00 PM', score: 98 },
    { day: 'Tue', time: '9:00 PM', score: 93 },
    { day: 'Sun', time: '8:00 PM', score: 88 },
  ],
  google: [
    { day: 'Mon', time: '10:00 AM', score: 79 },
    { day: 'Wed', time: '2:00 PM', score: 74 },
    { day: 'Thu', time: '11:00 AM', score: 70 },
  ],
}

// ----------------------------------------------------------------------------
// 5. COMPETITOR BENCHMARKING + share of voice
// SOURCE: third-party competitive intel (e.g. Sprout/Rival IQ-style scrape) or
// each network's public profile metrics. No internal source — fully external.
// ----------------------------------------------------------------------------
export type Competitor = {
  name: string
  engagementRate: number
  followerGrowthPct: number
  shareOfVoicePct: number
  isYou?: boolean
}

const COMPETITORS: Competitor[] = [
  { name: 'Your brand', engagementRate: 4.8, followerGrowthPct: 18.6, shareOfVoicePct: 28, isYou: true },
  { name: 'Brightleaf Co.', engagementRate: 3.9, followerGrowthPct: 11.2, shareOfVoicePct: 24 },
  { name: 'Maker & Main', engagementRate: 5.4, followerGrowthPct: 9.8, shareOfVoicePct: 21 },
  { name: 'Northstar Studio', engagementRate: 2.7, followerGrowthPct: 6.1, shareOfVoicePct: 15 },
  { name: 'Other brands', engagementRate: 3.1, followerGrowthPct: 4.4, shareOfVoicePct: 12 },
]

// ----------------------------------------------------------------------------
// 7. CUSTOM REPORT BUILDER — widget toggles + export formats
// SOURCE: user config (would persist to a `report_layouts` table). Export
// rendering would run server-side (PDF/CSV/PPTX generators).
// ----------------------------------------------------------------------------
export type ReportWidget = { id: string; label: string; defaultOn: boolean }

export const REPORT_WIDGETS: ReportWidget[] = [
  { id: 'kpis', label: 'Core KPI cards', defaultOn: true },
  { id: 'trend', label: 'Engagement trend chart', defaultOn: true },
  { id: 'top-content', label: 'Top content', defaultOn: true },
  { id: 'posts', label: 'Post performance table', defaultOn: true },
  { id: 'audience', label: 'Audience demographics', defaultOn: false },
  { id: 'best-time', label: 'Best time to post', defaultOn: false },
  { id: 'competitors', label: 'Competitor benchmark', defaultOn: false },
  { id: 'roi', label: 'ROI / attribution', defaultOn: false },
]

export const EXPORT_FORMATS = ['PDF', 'CSV', 'PowerPoint'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

// ----------------------------------------------------------------------------
// 8. ROI / CONVERSION ATTRIBUTION (UTM)
// SOURCE: UTM-tagged link clicks via Google Analytics 4 + Stripe transactions
// (lib/stripe.ts), attributed back to a `scheduled_posts` row by campaign tag.
// ----------------------------------------------------------------------------
export type RoiRow = {
  postId: string
  caption: string
  platform: RealNetwork
  utmCampaign: string
  clicks: number
  conversions: number
  revenue: number
}

const ROI_ROWS: RoiRow[] = [
  { postId: 'p2', caption: 'POV: marketing made simple', platform: 'tiktok', utmCampaign: 'spring_launch', clicks: 3_120, conversions: 184, revenue: 5_336 },
  { postId: 'p6', caption: 'New feature drop: AI captions', platform: 'instagram', utmCampaign: 'ai_captions', clicks: 2_410, conversions: 142, revenue: 4_118 },
  { postId: 'p9', caption: 'Weekend sale — 20% off all plans', platform: 'facebook', utmCampaign: 'weekend_sale', clicks: 1_980, conversions: 211, revenue: 6_119 },
  { postId: 'p10', caption: 'Search ad: marketing suite', platform: 'google', utmCampaign: 'brand_search', clicks: 4_540, conversions: 268, revenue: 7_772 },
  { postId: 'p3', caption: 'How we cut email churn by 22%', platform: 'linkedin', utmCampaign: 'b2b_retention', clicks: 740, conversions: 38, revenue: 3_990 },
  { postId: 'p1', caption: '5 quick wins for your spring launch', platform: 'instagram', utmCampaign: 'spring_launch', clicks: 1_260, conversions: 64, revenue: 1_856 },
]

// ----------------------------------------------------------------------------
// 9. SOCIAL LISTENING + SENTIMENT (enterprise — Pro & Agency only)
// SOURCE: social-listening provider (Brandwatch/Talkwalker-style) brand-mention
// stream, with sentiment classified by Claude (lib/anthropic.ts). Fully
// external — no internal source. Gated by lib/analytics/plan.ts.
// ----------------------------------------------------------------------------
export type SentimentBreakdown = { positive: number; neutral: number; negative: number }
export type Mention = {
  id: string
  source: string
  author: string
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
  at: string
}
export type ListeningData = {
  totalMentions: number
  deltaPct: number
  shareOfVoicePct: number
  sentiment: SentimentBreakdown
  mentions: Mention[]
}

const LISTENING: ListeningData = {
  totalMentions: 1_842,
  deltaPct: 21.3,
  shareOfVoicePct: 28,
  sentiment: { positive: 64, neutral: 27, negative: 9 },
  mentions: [
    { id: 'm1', source: 'Instagram', author: '@bloomandco', text: 'Tala made scheduling our launch so easy — obsessed 💜', sentiment: 'positive', at: '2026-06-21' },
    { id: 'm2', source: 'X', author: '@founderlife', text: 'Anyone compared Tala vs the bigger tools? Curious on pricing.', sentiment: 'neutral', at: '2026-06-21' },
    { id: 'm3', source: 'TikTok', author: '@creatorjules', text: 'The AI captions in Tala are shockingly good lol', sentiment: 'positive', at: '2026-06-20' },
    { id: 'm4', source: 'Reddit', author: 'u/smallbizmarketer', text: 'Wish the analytics export had more formats, otherwise solid.', sentiment: 'negative', at: '2026-06-20' },
    { id: 'm5', source: 'LinkedIn', author: 'Maya R.', text: 'Switched our agency clients to Tala this quarter — great support.', sentiment: 'positive', at: '2026-06-19' },
  ],
}

// ============================================================================
// ACCESSORS — the ONLY surface the UI touches. Swap the body of each to a real
// query later without changing any component.
// ============================================================================

function biasedDelta(base: number, network: Network): number {
  if (network === 'all') return base
  return Math.round((base + NETWORK_DELTA_BIAS[network]) * 10) / 10
}

/** 1. Core KPI cards, filtered by network. */
export function getCoreMetrics(network: Network): Kpi[] {
  return (Object.keys(BASE_KPIS) as MetricKey[]).map((key) => {
    const spec = BASE_KPIS[key]
    let value = spec.value
    if (network !== 'all') {
      if (key === 'engagementRate') {
        value = NETWORK_ENGAGEMENT_RATE[network]
      } else if (spec.additive) {
        value = Math.round(spec.value * NETWORK_WEIGHT[network])
      }
    }
    return {
      key,
      label: spec.label,
      value,
      format: spec.format,
      deltaPct: biasedDelta(spec.deltaPct, network),
    }
  })
}

/**
 * Aggregate per-network KPI sets into an "All networks" set. Used by the server
 * loader when at least one network has LIVE data, so the All view reflects the
 * real numbers (sum additive metrics, average the engagement rate).
 */
export function aggregateKpis(perNetwork: Kpi[][]): Kpi[] {
  return (Object.keys(BASE_KPIS) as MetricKey[]).flatMap((key) => {
    const spec = BASE_KPIS[key]
    const vals = perNetwork
      .map((set) => set.find((k) => k.key === key))
      .filter((k): k is Kpi => Boolean(k))
    // Only surface a metric the underlying networks actually reported — never
    // fabricate a card for a metric nobody provided.
    if (vals.length === 0) return []
    const value = spec.additive
      ? vals.reduce((s, k) => s + k.value, 0)
      : vals.reduce((s, k) => s + k.value, 0) / vals.length
    // Carry a delta only if every contributing network has a real one;
    // otherwise null (no fabricated period-over-period).
    const deltas = vals.map((k) => k.deltaPct).filter((d): d is number => d !== null)
    const deltaPct =
      deltas.length === vals.length
        ? Math.round((deltas.reduce((s, d) => s + d, 0) / vals.length) * 10) / 10
        : null
    return [
      {
        key,
        label: spec.label,
        value: Math.round(value * 10) / 10,
        format: spec.format,
        deltaPct,
      },
    ]
  })
}

/** 1b. Daily engagement + reach trend (last 30 days), filtered by network. */
export function getTrend(network: Network): TrendPoint[] {
  const labels = lastNDateLabels(30)
  const rand = seeded(networkSeed(network))
  const scale = network === 'all' ? 1 : NETWORK_WEIGHT[network]
  const baseEngagement = 920 * scale
  const baseReach = 6_100 * scale
  return labels.map((label, i) => {
    const trend = 1 + i * 0.012 // gentle upward drift across the period
    const wobble = 0.85 + rand() * 0.3
    return {
      label,
      engagement: Math.round(baseEngagement * trend * wobble),
      reach: Math.round(baseReach * trend * (0.85 + rand() * 0.3)),
    }
  })
}

/** 2. Post-level performance, filtered by network. */
export function getPostPerformance(network: Network): PostRow[] {
  if (network === 'all') return POSTS
  return POSTS.filter((p) => p.platform === network)
}

/** 2b. Top content — highest engagement-rate posts, filtered by network. */
export function getTopContent(network: Network, limit = 3): PostRow[] {
  return [...getPostPerformance(network)]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, limit)
}

/** 3. Audience insights, filtered by network. */
export function getAudience(network: Network): AudienceData {
  const rand = seeded(networkSeed(network) + 13)
  const values = HEATMAP_DAYS.map(() =>
    Array.from({ length: 24 }, (_, hour) => {
      // Peak around midday + early evening, weekends slightly flatter.
      const peak = Math.exp(-((hour - 12) ** 2) / 28) + 0.6 * Math.exp(-((hour - 19) ** 2) / 10)
      return Math.round(Math.min(100, peak * 100 * (0.6 + rand() * 0.5)))
    })
  )

  const followerBase = network === 'all' ? 48_200 : Math.round(48_200 * NETWORK_WEIGHT[network])
  const followerSeries = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label, i) => ({
    label,
    value: Math.round(followerBase * (1 + i * 0.06)),
  }))

  const topGender =
    network === 'linkedin'
      ? { label: 'Men', pct: 56 }
      : { label: 'Women', pct: 61 }

  return {
    locations: AUDIENCE_LOCATIONS,
    ageRanges: AUDIENCE_AGES,
    topGender,
    heatmap: { days: HEATMAP_DAYS, hourLabels: HEATMAP_HOUR_LABELS, values },
    followerSeries,
  }
}

/** 4. Claude-recommended best times to post, per network. */
export function getBestTimes(network: Network): TimeSlot[] {
  if (network === 'all') return BEST_TIMES_ALL
  return BEST_TIMES_BY_NETWORK[network]
}

/** 5. Competitor benchmark + share of voice. */
export function getCompetitors(network: Network): Competitor[] {
  // Reflect the selected network in "your" engagement rate so the benchmark
  // tracks the cross-network filter; rivals stay fixed (external mock).
  if (network === 'all') return COMPETITORS
  const yourRate = NETWORK_ENGAGEMENT_RATE[network]
  return COMPETITORS.map((c) => (c.isYou ? { ...c, engagementRate: yourRate } : c))
}

/** 8. ROI / conversion attribution, filtered by network. */
export function getRoiAttribution(network: Network): RoiRow[] {
  if (network === 'all') return ROI_ROWS
  return ROI_ROWS.filter((r) => r.platform === network)
}

/**
 * 9. Social listening + sentiment. ENTERPRISE-ONLY.
 * Call this ONLY after confirming the plan allows it (canUseSocialListening) —
 * lower tiers must never receive the real (mock) data.
 */
export function getSocialListening(network: Network): ListeningData {
  // Scale mention volume to the selected network so the filter applies here too.
  if (network === 'all') return LISTENING
  return {
    ...LISTENING,
    totalMentions: Math.round(LISTENING.totalMentions * NETWORK_WEIGHT[network]),
    shareOfVoicePct: Math.max(5, Math.round(LISTENING.shareOfVoicePct * (0.6 + NETWORK_WEIGHT[network]))),
  }
}
