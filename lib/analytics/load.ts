// ============================================================================
// ANALYTICS DATA LOADER (server-only)
// ----------------------------------------------------------------------------
// Single entry point the page uses to get analytics data. For each network it
// returns LIVE data when the customer has connected that account (and the
// provider succeeds) and otherwise:
//   • development  → falls back to MOCK data (for building/previewing)
//   • production   → leaves the section EMPTY (real data only — no placeholders)
// driven by ALLOW_MOCK_ANALYTICS (lib/analytics/config.ts).
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
  getMockFollowers,
  aggregateKpis,
  type Network,
  type Kpi,
  type PostRow,
  type RealNetwork,
} from '@/app/(dashboard)/analytics/mock-data'
import {
  matchCrossChannelFollowers,
  type FollowerProfile,
  type CrossChannelPerson,
} from '@/lib/analytics/cross-channel'
import type { Provider } from '@/lib/analytics/providers/util'
import { fetchMeta } from '@/lib/analytics/providers/meta'
import { fetchLinkedIn } from '@/lib/analytics/providers/linkedin'
import { fetchTikTok } from '@/lib/analytics/providers/tiktok'
import { fetchGoogle } from '@/lib/analytics/providers/google'
import type { SectionSource } from '@/lib/analytics/format'

export type { SectionSource }

export type AnalyticsData = {
  coreMetricsByNetwork: Record<Network, { kpis: Kpi[]; source: SectionSource }>
  postsByNetwork: Record<Network, { posts: PostRow[]; source: SectionSource }>
  /**
   * People matched as following on 2+ networks. Resolved server-side from live
   * follower rosters (mock baseline in dev, empty in prod when none connected).
   * The list is the full cross-network set; the client filters it by network.
   */
  crossChannel: { people: CrossChannelPerson[]; source: SectionSource }
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
  // 1. Baseline: mock in dev, empty in prod.
  const mockKpis = (id: Network) =>
    ALLOW_MOCK_ANALYTICS
      ? { kpis: getCoreMetrics(id), source: 'mock' as SectionSource }
      : { kpis: [], source: 'empty' as SectionSource }
  const mockPosts = (id: Network) =>
    ALLOW_MOCK_ANALYTICS
      ? { posts: getPostPerformance(id), source: 'mock' as SectionSource }
      : { posts: [], source: 'empty' as SectionSource }

  const coreMetricsByNetwork = {} as AnalyticsData['coreMetricsByNetwork']
  const postsByNetwork = {} as AnalyticsData['postsByNetwork']
  for (const { id } of NETWORKS) {
    coreMetricsByNetwork[id] = mockKpis(id)
    postsByNetwork[id] = mockPosts(id)
  }

  // 2. Overlay live data for every connected, supported platform.
  const livePlatforms: RealNetwork[] = []
  const liveFollowers: FollowerProfile[] = []
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
        if (result?.kpis) coreMetricsByNetwork[platform] = { kpis: result.kpis, source: 'live' }
        if (result?.posts) postsByNetwork[platform] = { posts: result.posts, source: 'live' }
        if (result?.followers?.length) liveFollowers.push(...result.followers)
        if (result?.kpis || result?.posts) livePlatforms.push(platform)
      }
    }
  } catch (err) {
    // Never let a data-source failure break the page.
    logError('analytics/load', 'Live analytics load failed', err)
  }

  // 3. Recompute the "All" aggregate from per-network data once anything is
  //    live, so the unified view reflects the real numbers.
  if (livePlatforms.length > 0) {
    const liveKpiSets = REAL_NETWORKS.map((n) => coreMetricsByNetwork[n].kpis).filter((k) => k.length > 0)
    coreMetricsByNetwork.all = { kpis: aggregateKpis(liveKpiSets), source: 'mixed' }
    postsByNetwork.all = {
      posts: REAL_NETWORKS.flatMap((n) => postsByNetwork[n].posts),
      source: 'mixed',
    }
  }

  // 4. Cross-channel followers: match over LIVE rosters when any platform
  //    returned them; otherwise mock in dev / empty in prod. We never mix live
  //    and mock followers (a real person must not match a sample one).
  let crossChannel: AnalyticsData['crossChannel']
  if (liveFollowers.length > 0) {
    crossChannel = { people: matchCrossChannelFollowers(liveFollowers), source: 'live' }
  } else if (ALLOW_MOCK_ANALYTICS) {
    crossChannel = { people: matchCrossChannelFollowers(getMockFollowers()), source: 'mock' }
  } else {
    crossChannel = { people: [], source: 'empty' }
  }

  return { coreMetricsByNetwork, postsByNetwork, crossChannel, livePlatforms, allowMock: ALLOW_MOCK_ANALYTICS }
}
