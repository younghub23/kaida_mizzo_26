'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DemoBanner } from '@/components/analytics/data-source'
import { CorePerformance } from '@/components/analytics/core-performance'
import { TopContent } from '@/components/analytics/top-content'
import { PostPerformance } from '@/components/analytics/post-performance'
import { AudienceInsights } from '@/components/analytics/audience-insights'
import { CrossChannelFollowers } from '@/components/analytics/cross-channel-followers'
import { BestTimes } from '@/components/analytics/best-times'
import { CompetitorBenchmark } from '@/components/analytics/competitor-benchmark'
import { ReportBuilder } from '@/components/analytics/report-builder'
import { RoiAttribution } from '@/components/analytics/roi-attribution'
import { SocialListening } from '@/components/analytics/social-listening'
import { NETWORKS, type Network } from '@/app/(dashboard)/analytics/mock-data'
import { NETWORK_LABEL } from '@/components/analytics/network-meta'
import type { AnalyticsData } from '@/lib/analytics/load'

/**
 * Client orchestrator. Owns the cross-network filter and passes the selected
 * network down to every section so the whole page reacts to it (Section 6:
 * cross-network unified reporting).
 *
 * Core metrics and post performance come pre-resolved from the server (live
 * where an account is connected, mock otherwise); the remaining sections still
 * read mock data directly until their providers are built.
 */
export function AnalyticsDashboard({
  data,
  socialListeningUnlocked,
}: {
  data: AnalyticsData
  socialListeningUnlocked: boolean
}) {
  const [network, setNetwork] = useState<Network>('all')

  const core = data.coreMetricsByNetwork[network]
  const posts = data.postsByNetwork[network]

  return (
    <div className="flex flex-col gap-8">
      <DemoBanner
        livePlatforms={data.livePlatforms.map((p) => NETWORK_LABEL[p])}
        allowMock={data.allowMock}
      />

      {/* Section 6 — cross-network filter that drives every section below. */}
      <Tabs value={network} onValueChange={(v) => setNetwork(v as Network)}>
        <TabsList className="flex-wrap">
          {NETWORKS.map((n) => (
            <TabsTrigger key={n.id} value={n.id}>
              {n.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <CorePerformance network={network} kpis={core.kpis} source={core.source} />
      <TopContent posts={posts.posts} source={posts.source} />
      <PostPerformance posts={posts.posts} source={posts.source} />
      <AudienceInsights network={network} />
      <CrossChannelFollowers
        people={data.crossChannelFollowers.people}
        source={data.crossChannelFollowers.source}
        network={network}
      />
      <BestTimes network={network} />
      <CompetitorBenchmark network={network} />
      <RoiAttribution network={network} />
      <ReportBuilder />
      <SocialListening network={network} unlocked={socialListeningUnlocked} />
    </div>
  )
}
