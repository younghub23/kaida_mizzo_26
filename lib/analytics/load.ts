// ============================================================================
// ANALYTICS DATA LOADER (server-only)
// ----------------------------------------------------------------------------
// Single entry point the page uses to get analytics data. For each network it
// returns LIVE data when the customer has connected that account (and the
// platform provider succeeds) and falls back to MOCK otherwise, tagging each
// section with where its data actually came from so the UI can label it.
//
// Today only Meta (Instagram + Facebook) has a live provider. LinkedIn, TikTok
// and Google fall back to mock until their providers are built — see
// app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'
import {
  NETWORKS,
  REAL_NETWORKS,
  getCoreMetrics,
  getPostPerformance,
  aggregateKpis,
  type Network,
  type Kpi,
  type PostRow,
  type RealNetwork,
} from '@/app/(dashboard)/analytics/mock-data'
import { fetchMetaPlatformAnalytics } from '@/lib/analytics/providers/meta'
import type { SectionSource } from '@/lib/analytics/format'

export type { SectionSource }

export type AnalyticsData = {
  coreMetricsByNetwork: Record<Network, { kpis: Kpi[]; source: SectionSource }>
  postsByNetwork: Record<Network, { posts: PostRow[]; source: SectionSource }>
  /** Platforms that successfully returned live data this load. */
  livePlatforms: RealNetwork[]
}

// Platforms with a live provider wired up today.
const META_PLATFORMS: RealNetwork[] = ['instagram', 'facebook']

export async function loadAnalytics(): Promise<AnalyticsData> {
  // 1. Seed every network with mock data (guaranteed-complete baseline).
  const coreMetricsByNetwork = {} as AnalyticsData['coreMetricsByNetwork']
  const postsByNetwork = {} as AnalyticsData['postsByNetwork']
  for (const { id } of NETWORKS) {
    coreMetricsByNetwork[id] = { kpis: getCoreMetrics(id), source: 'mock' }
    postsByNetwork[id] = { posts: getPostPerformance(id), source: 'mock' }
  }

  // 2. Overlay live data for any connected, supported platform.
  const livePlatforms: RealNetwork[] = []
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('platform, access_token')
        .eq('user_id', user.id)
        .in('platform', META_PLATFORMS)

      for (const account of accounts ?? []) {
        const platform = account.platform as 'instagram' | 'facebook'
        const result = await fetchMetaPlatformAnalytics({
          platform,
          accessToken: account.access_token,
        })
        if (result) {
          coreMetricsByNetwork[platform] = { kpis: result.kpis, source: 'live' }
          postsByNetwork[platform] = { posts: result.posts, source: 'live' }
          livePlatforms.push(platform)
        }
      }
    }
  } catch (err) {
    // Never let a data-source failure break the page — keep the mock baseline.
    logError('analytics/load', 'Live analytics load failed; serving mock', err)
  }

  // 3. If anything went live, recompute the "All" aggregate from per-network
  //    data so the unified view reflects the real numbers.
  if (livePlatforms.length > 0) {
    coreMetricsByNetwork.all = {
      kpis: aggregateKpis(REAL_NETWORKS.map((n) => coreMetricsByNetwork[n].kpis)),
      source: 'mixed',
    }
    postsByNetwork.all = {
      posts: REAL_NETWORKS.flatMap((n) => postsByNetwork[n].posts),
      source: 'mixed',
    }
  }

  return { coreMetricsByNetwork, postsByNetwork, livePlatforms }
}
