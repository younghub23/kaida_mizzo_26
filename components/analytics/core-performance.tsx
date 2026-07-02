import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { SectionInfo } from '@/components/analytics/section-info'
import { LineChart } from '@/components/analytics/charts'
import { type Kpi, type MetricKey, type TrendPoint } from '@/app/(dashboard)/analytics/mock-data'
import { formatCompact, formatPercent, formatDelta, sourceSuffix, type SectionSource } from '@/lib/analytics/format'

// Category-tinted KPI numbers, echoing the dashboard's warm palette. Keyed by
// metric, with a vivid fallback cycle for anything unmapped.
// Per-metric KPI number colours, mirroring the mockup's grid: engagement
// content-teal, followers magenta, reach tangerine, impressions work-blue,
// clicks olive-green — drawing on the full data-viz palette, not just pink/blue.
const KPI_COLOR: Partial<Record<MetricKey, string>> = {
  engagementRate: '#1E7B82', // content-teal
  followers: '#C12C6E',
  reach: '#D97A2C',
  impressions: '#3A6E92', // work / blue
  clicks: '#5E8C3E', // green
  followerGrowth: '#5E8C3E',
  likes: '#C12C6E',
  comments: '#1E7B82',
  shares: '#D97A2C',
}
const KPI_FALLBACK = ['#1E7B82', '#C12C6E', '#D97A2C', '#3A6E92', '#5E8C3E']
// Up = warm olive-green, down = rust — matching the dashboard's delta colours.
const DELTA_UP = '#4C6633'
const DELTA_DOWN = '#C8472E'

export function CorePerformance({
  kpis,
  source,
  trend,
  trendSource,
}: {
  kpis: Kpi[]
  source: SectionSource
  // Daily time series for the trend chart; live where a provider (GA4) supplies
  // it, mock in dev, empty otherwise. Rendered only when it has real points.
  trend: TrendPoint[]
  trendSource: SectionSource
}) {
  return (
    <Section
      title="Core performance"
      icon={Activity}
      iconColor="#D6498C"
      eyebrow="Overview"
      source={`Meta / LinkedIn / TikTok / Google APIs ${sourceSuffix(source)}`}
      description="Unified KPIs across every connected account — one view instead of toggling each native dashboard."
    >
      {source === 'empty' || kpis.length === 0 ? (
        <EmptyState message="Connect an account to see your unified performance metrics." />
      ) : (
      <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
          const up = kpi.deltaPct !== null && kpi.deltaPct >= 0
          const color = KPI_COLOR[kpi.key] ?? KPI_FALLBACK[i % KPI_FALLBACK.length]
          return (
            <Card key={kpi.key} size="sm">
              <CardHeader>
                <CardDescription className="text-[10.5px] font-semibold uppercase tracking-[0.12em]">
                  {kpi.label}
                </CardDescription>
                <CardTitle
                  className="font-fredoka text-[28px] font-semibold leading-[1.1] tabular-nums"
                  style={{ color }}
                >
                  {kpi.format === 'percent' ? formatPercent(kpi.value) : formatCompact(kpi.value)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Only show a period-over-period delta when it's a real number;
                    live data has none yet, so we omit it rather than fake it. */}
                {kpi.deltaPct !== null && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium"
                    style={{ color: up ? DELTA_UP : DELTA_DOWN }}
                  >
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {formatDelta(kpi.deltaPct)}
                    <span className="text-muted-foreground">vs last period</span>
                  </span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {trend.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="font-fredoka font-semibold">Engagement &amp; reach</CardTitle>
              <SectionInfo title="Engagement & reach trend" color="#D6498C">
                A day-by-day line of total engagement (interactions) and reach (unique people who
                saw your posts) over the last 30 days. Rising lines mean your content is reaching and
                resonating with more people; dips flag quieter stretches worth a closer look.
              </SectionInfo>
            </div>
            <CardDescription>Last 30 days · time series {sourceSuffix(trendSource)}</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              labels={trend.map((p) => p.label)}
              // Pink engagement line over a vertical pink→tangerine→lemon wash,
              // turquoise reach line — fed by the real trend series.
              areaGradient={['#D6498C', '#E08A3C', '#F4C96D']}
              series={[
                { label: 'Engagement', color: '#D6498C', values: trend.map((p) => p.engagement) },
                { label: 'Reach', color: '#36B7C0', values: trend.map((p) => p.reach) },
              ]}
            />
          </CardContent>
        </Card>
      )}
      </>
      )}
    </Section>
  )
}
