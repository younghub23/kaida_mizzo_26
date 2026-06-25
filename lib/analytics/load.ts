// ============================================================================
// ANALYTICS DATA LOADER (server-only)
// ----------------------------------------------------------------------------
// Single entry point the page uses to get analytics data. For each network it
// returns LIVE data when the customer has connected that account (and the
// provider succeeds) and otherwise leaves the section EMPTY — real data only,
// no placeholders. Mock/demo data is opt-in for local previewing only, via
// ALLOW_MOCK_ANALYTICS (lib/analytics/config.ts → NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK).
//
// Each section is tagged with where its data came from so the UI can label it.
// Meta has a complete provider; LinkedIn/TikTok/Google providers are wired up
// and activate automatically once their connections/scopes are in place.
// See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'
import { ALLOW_MOCK_ANALYTICS } from '@/lib/analytics/config'
import {
  NETWORKS,
  REAL_NETWORKS,
  getCoreMetrics,
  getPostPerformance,
  getTrend,
  getAudience,
  getBestTimes,
  getRoiAttribution,
  getCompetitors,
  getSocialListening,
  getSampleFollowerRosters,
  aggregateKpis,
  type Network,
  type Kpi,
  type PostRow,
  type TrendPoint,
  type AudienceData,
  type TimeSlot,
  type RoiRow,
  type Competitor,
  type ListeningData,
  type RealNetwork,
} from '@/app/(dashboard)/analytics/mock-data'
import type { Provider } from '@/lib/analytics/providers/util'
import { fetchMeta } from '@/lib/analytics/providers/meta'
import { fetchLinkedIn } from '@/lib/analytics/providers/linkedin'
import { fetchTikTok } from '@/lib/analytics/providers/tiktok'
import { fetchGoogle } from '@/lib/analytics/providers/google'
import { fetchCompetitorBenchmark } from '@/lib/analytics/providers/competitor'
import { fetchSocialListening } from '@/lib/analytics/providers/listening'
import {
  matchCrossChannelFollowers,
  type NetworkRoster,
  type MatchedPerson,
} from '@/lib/analytics/cross-channel'
import type { SectionSource } from '@/lib/analytics/format'

export type { SectionSource }

export type AnalyticsData = {
  coreMetricsByNetwork: Record<Network, { kpis: Kpi[]; source: SectionSource }>
  postsByNetwork: Record<Network, { posts: PostRow[]; source: SectionSource }>
  /** Daily engagement/reach trend per network (live where a provider supplies it). */
  trendByNetwork: Record<Network, { trend: TrendPoint[]; source: SectionSource }>
  /** Audience demographics per network (live where a provider supplies it). */
  audienceByNetwork: Record<Network, { audience: AudienceData | null; source: SectionSource }>
  /** Best posting windows per network, derived from each account's real engagement. */
  bestTimesByNetwork: Record<Network, { slots: TimeSlot[]; source: SectionSource }>
  /** ROI/UTM attribution rows (brand-level; live from GA4 campaigns + revenue). */
  roi: { rows: RoiRow[]; source: SectionSource }
  /** Competitor benchmark (brand-level; needs a competitive-intel integration). */
  competitors: { rows: Competitor[]; source: SectionSource }
  /** Social listening + sentiment (brand-level; needs a brand-monitoring integration). */
  socialListening: { data: ListeningData | null; source: SectionSource }
  /**
   * Cross-channel followers — people who follow us on 2+ networks under
   * near-duplicate identities, matched server-side from per-platform rosters.
   * `live` when real rosters were available, `mock` for the dev sample, `empty`
   * in production with no follower source. Live and mock are never mixed.
   */
  crossChannelFollowers: { people: MatchedPerson[]; source: SectionSource }
  /** Platforms that successfully returned live data this load. */
  livePlatforms: RealNetwork[]
  /** Whether mock fallback is permitted (dev) or data must be real (prod). */
  allowMock: boolean
}

// Live providers, keyed by network. Meta is fully implemented; the others are
// wired up and fall back until their connections/scopes exist.
const PROVIDERS: Record<RealNetwork, Provider> = {
  instagram: fetchMeta,
  facebook: fetchMeta,
  linkedin: fetchLinkedIn,
  tiktok: fetchTikTok,
  google: fetchGoogle,
}

export async function loadAnalytics(): Promise<AnalyticsData> {
  // 1. Baseline: empty (real data only); mock only when explicitly opted in.
  const mockKpis = (id: Network) =>
    ALLOW_MOCK_ANALYTICS
      ? { kpis: getCoreMetrics(id), source: 'mock' as SectionSource }
      : { kpis: [], source: 'empty' as SectionSource }
  const mockPosts = (id: Network) =>
    ALLOW_MOCK_ANALYTICS
      ? { posts: getPostPerformance(id), source: 'mock' as SectionSource }
      : { posts: [], source: 'empty' as SectionSource }
  const mockTrend = (id: Network) =>
    ALLOW_MOCK_ANALYTICS
      ? { trend: getTrend(id), source: 'mock' as SectionSource }
      : { trend: [], source: 'empty' as SectionSource }
  const mockAudience = (id: Network) =>
    ALLOW_MOCK_ANALYTICS
      ? { audience: getAudience(id), source: 'mock' as SectionSource }
      : { audience: null, source: 'empty' as SectionSource }
  const mockBestTimes = (id: Network) =>
    ALLOW_MOCK_ANALYTICS
      ? { slots: getBestTimes(id), source: 'mock' as SectionSource }
      : { slots: [], source: 'empty' as SectionSource }

  const coreMetricsByNetwork = {} as AnalyticsData['coreMetricsByNetwork']
  const postsByNetwork = {} as AnalyticsData['postsByNetwork']
  const trendByNetwork = {} as AnalyticsData['trendByNetwork']
  const audienceByNetwork = {} as AnalyticsData['audienceByNetwork']
  const bestTimesByNetwork = {} as AnalyticsData['bestTimesByNetwork']
  for (const { id } of NETWORKS) {
    coreMetricsByNetwork[id] = mockKpis(id)
    postsByNetwork[id] = mockPosts(id)
    trendByNetwork[id] = mockTrend(id)
    audienceByNetwork[id] = mockAudience(id)
    bestTimesByNetwork[id] = mockBestTimes(id)
  }

  // Brand-level sections (not per-network). ROI is overlaid from live providers
  // below; competitor + social listening come from external integrations.
  let roi = ALLOW_MOCK_ANALYTICS
    ? { rows: getRoiAttribution('all'), source: 'mock' as SectionSource }
    : { rows: [] as RoiRow[], source: 'empty' as SectionSource }
  const liveRoiRows: RoiRow[] = []

  // 2. Overlay live data for every connected, supported platform.
  const livePlatforms: RealNetwork[] = []
  // Live follower rosters, collected per platform that exposes one. Kept apart
  // from the mock sample so the two are never mixed in the matcher.
  const liveRosters: NetworkRoster[] = []
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('platform, access_token, refresh_token, token_expires_at, platform_user_id')
        .eq('user_id', user.id)
        .in('platform', REAL_NETWORKS)

      for (const account of accounts ?? []) {
        const platform = account.platform as RealNetwork
        const provider = PROVIDERS[platform]
        if (!provider) continue

        const result = await provider(account)
        // Overlay each part independently; non-live parts keep their baseline.
        // Only treat a part as live when it actually carries real data.
        if (result?.kpis?.length) coreMetricsByNetwork[platform] = { kpis: result.kpis, source: 'live' }
        if (result?.posts?.length) postsByNetwork[platform] = { posts: result.posts, source: 'live' }
        if (result?.trend?.length) trendByNetwork[platform] = { trend: result.trend, source: 'live' }
        if (result?.audience) audienceByNetwork[platform] = { audience: result.audience, source: 'live' }
        if (result?.bestTimes?.length) bestTimesByNetwork[platform] = { slots: result.bestTimes, source: 'live' }
        if (result?.roi?.length) liveRoiRows.push(...result.roi)
        if (result?.followers?.length) liveRosters.push({ platform, followers: result.followers })
        if (
          result?.kpis?.length ||
          result?.posts?.length ||
          result?.trend?.length ||
          result?.audience ||
          result?.bestTimes?.length ||
          result?.roi?.length
        )
          livePlatforms.push(platform)
      }
    }
  } catch (err) {
    // Never let a data-source failure break the page.
    logError('analytics/load', 'Live analytics load failed', err)
  }

  // 2a. ROI is brand-level: any live attribution rows replace the baseline.
  if (liveRoiRows.length) roi = { rows: liveRoiRows, source: 'live' }

  // 2a'. Competitor benchmark + social listening come from external integrations
  //      (not connected social accounts). Live when configured, else mock(dev)/empty.
  let competitors = ALLOW_MOCK_ANALYTICS
    ? { rows: getCompetitors('all'), source: 'mock' as SectionSource }
    : { rows: [] as Competitor[], source: 'empty' as SectionSource }
  let socialListening: AnalyticsData['socialListening'] = ALLOW_MOCK_ANALYTICS
    ? { data: getSocialListening('all'), source: 'mock' }
    : { data: null, source: 'empty' }
  try {
    const comp = await fetchCompetitorBenchmark()
    if (comp?.length) competitors = { rows: comp, source: 'live' }
    const listen = await fetchSocialListening()
    if (listen) socialListening = { data: listen, source: 'live' }
  } catch (err) {
    logError('analytics/load', 'Competitor/listening load failed', err)
  }

  // 2b. Cross-channel followers. Run the deterministic matcher over LIVE rosters
  //     when any provider supplied one; otherwise fall back to the dev sample
  //     (mock) or an empty section in production. Live and mock are never mixed.
  let crossChannelFollowers: AnalyticsData['crossChannelFollowers']
  if (liveRosters.length > 0) {
    crossChannelFollowers = { people: matchCrossChannelFollowers(liveRosters), source: 'live' }
  } else if (ALLOW_MOCK_ANALYTICS) {
    crossChannelFollowers = { people: matchCrossChannelFollowers(getSampleFollowerRosters()), source: 'mock' }
  } else {
    crossChannelFollowers = { people: [], source: 'empty' }
  }

  // 3. Recompute the "All" aggregate from per-network data once anything is
  //    live, so the unified view reflects the real numbers.
  if (livePlatforms.length > 0) {
    // With mock off, every per-network contribution is live, so the aggregate is
    // 'live'. With mock opted in (dev), unconnected networks contribute mock
    // baselines, so it's genuinely 'mixed'.
    const aggSource: SectionSource = ALLOW_MOCK_ANALYTICS ? 'mixed' : 'live'
    const liveKpiSets = REAL_NETWORKS.map((n) => coreMetricsByNetwork[n].kpis).filter((k) => k.length > 0)
    coreMetricsByNetwork.all = { kpis: aggregateKpis(liveKpiSets), source: aggSource }
    postsByNetwork.all = {
      posts: REAL_NETWORKS.flatMap((n) => postsByNetwork[n].posts),
      source: aggSource,
    }

    // Trend + audience aren't summable across networks, so the unified "All" view
    // adopts whichever connected network supplied them (today only GA4/Google).
    const liveTrend = REAL_NETWORKS.find((n) => trendByNetwork[n].source === 'live')
    if (liveTrend) trendByNetwork.all = { ...trendByNetwork[liveTrend], source: aggSource }
    const liveAudience = REAL_NETWORKS.find((n) => audienceByNetwork[n].source === 'live')
    if (liveAudience) audienceByNetwork.all = { ...audienceByNetwork[liveAudience], source: aggSource }
  }

  return {
    coreMetricsByNetwork,
    postsByNetwork,
    trendByNetwork,
    audienceByNetwork,
    bestTimesByNetwork,
    roi,
    competitors,
    socialListening,
    crossChannelFollowers,
    livePlatforms,
    allowMock: ALLOW_MOCK_ANALYTICS,
  }
}
