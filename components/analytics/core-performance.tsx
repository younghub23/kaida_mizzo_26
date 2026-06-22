import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import { Section } from '@/components/analytics/data-source'
import { LineChart } from '@/components/analytics/charts'
import { getCoreMetrics, getTrend, type Network } from '@/app/(dashboard)/analytics/mock-data'
import { formatCompact, formatPercent, formatDelta } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'

export function CorePerformance({ network }: { network: Network }) {
  const kpis = getCoreMetrics(network)
  const trend = getTrend(network)

  return (
    <Section
      title="Core performance"
      icon={Activity}
      source="Meta / LinkedIn / TikTok / Google APIs (mock)"
      description="Unified KPIs across every connected account — one view instead of toggling each native dashboard."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const up = kpi.deltaPct >= 0
          return (
            <Card key={kpi.key} size="sm">
              <CardHeader>
                <CardDescription>{kpi.label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {kpi.format === 'percent' ? formatPercent(kpi.value) : formatCompact(kpi.value)}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Engagement &amp; reach</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
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
    </Section>
  )
}
