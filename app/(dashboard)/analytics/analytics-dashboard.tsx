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
 * Core metrics, posts, the trend chart and audience demographics come
 * pre-resolved from the server (live where a provider supplies them, mock in
 * dev, empty otherwise); the remaining sections without a live provider read
 * mock in dev and show an empty state in production.
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
  const trend = data.trendByNetwork[network]
  const audience = data.audienceByNetwork[network]

  return (
    <div className="flex flex-col gap-8">
      <DemoBanner
        livePlatforms={data.livePlatforms.map((p) => NETWORK_LABEL[p])}
        allowMock={data.allowMock}
      />

      {/* Section 6 — cross-network filter that drives every section below.
          Pills mirror the dashboard sidebar's active item: a soft pink→sand
          gradient band + ink (see .analytics-page rules in globals.css). */}
      <Tabs value={network} onValueChange={(v) => setNetwork(v as Network)}>
        <TabsList className="h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
          {NETWORKS.map((n) => (
            <TabsTrigger
              key={n.id}
              value={n.id}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:font-semibold"
            >
              {n.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <CorePerformance
        kpis={core.kpis}
        source={core.source}
        trend={trend.trend}
        trendSource={trend.source}
      />
      <TopContent posts={posts.posts} source={posts.source} />
      <PostPerformance posts={posts.posts} source={posts.source} />
      <AudienceInsights audience={audience.audience} source={audience.source} />
      <CrossChannelFollowers
        people={data.crossChannelFollowers.people}
        source={data.crossChannelFollowers.source}
        network={network}
      />
      <BestTimes network={network} bestTimesByNetwork={data.bestTimesByNetwork} />
      <CompetitorBenchmark rows={data.competitors.rows} source={data.competitors.source} />
      <RoiAttribution network={network} rows={data.roi.rows} source={data.roi.source} />
      <ReportBuilder />
      <SocialListening
        data={data.socialListening.data}
        source={data.socialListening.source}
        unlocked={socialListeningUnlocked}
      />
    </div>
  )
}
