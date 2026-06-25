import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { LineChart } from '@/components/analytics/charts'
import { type Kpi, type TrendPoint } from '@/app/(dashboard)/analytics/mock-data'
import { formatCompact, formatPercent, formatDelta, sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'

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
      source={`Meta / LinkedIn / TikTok / Google APIs ${sourceSuffix(source)}`}
      description="Unified KPIs across every connected account — one view instead of toggling each native dashboard."
    >
      {source === 'empty' || kpis.length === 0 ? (
        <EmptyState message="Connect an account to see your unified performance metrics." />
      ) : (
      <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const up = kpi.deltaPct !== null && kpi.deltaPct >= 0
          return (
            <Card key={kpi.key} size="sm">
              <CardHeader>
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {kpi.format === 'percent' ? formatPercent(kpi.value) : formatCompact(kpi.value)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Only show a period-over-period delta when it's a real number;
                    live data has none yet, so we omit it rather than fake it. */}
                {kpi.deltaPct !== null && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium',
                      up ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    )}
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
            <CardTitle>Engagement &amp; reach</CardTitle>
            <CardDescription>Last 30 days · time series {sourceSuffix(trendSource)}</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              labels={trend.map((p) => p.label)}
              series={[
                { label: 'Engagement', color: 'var(--chart-3)', values: trend.map((p) => p.engagement) },
                { label: 'Reach', color: 'var(--chart-1)', values: trend.map((p) => p.reach) },
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
