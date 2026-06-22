import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { BarRow, ColumnChart } from '@/components/analytics/charts'
import { getAudience, type Network } from '@/app/(dashboard)/analytics/mock-data'
import { sourceSuffix } from '@/lib/analytics/format'
import { ALLOW_MOCK_ANALYTICS } from '@/lib/analytics/config'
import { cn } from '@/lib/utils'

export function AudienceInsights({ network }: { network: Network }) {
  const audience = getAudience(network)
  const maxLoc = Math.max(...audience.locations.map((l) => l.pct))
  const maxAge = Math.max(...audience.ageRanges.map((a) => a.pct))

  return (
    <Section
      title="Audience insights"
      icon={Users}
      source={`Meta / LinkedIn / TikTok audience APIs ${sourceSuffix(ALLOW_MOCK_ANALYTICS ? 'mock' : 'empty')}`}
      description="Who you're reaching — location, age, gender, active hours, and follower growth over time."
    >
      {!ALLOW_MOCK_ANALYTICS ? (
        <EmptyState message="Audience demographics will appear once an account with audience insights is connected." />
      ) : (
      <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top locations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {audience.locations.map((l) => (
              <BarRow key={l.country} label={l.country} value={l.pct} max={maxLoc} color="var(--chart-2)" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age ranges</CardTitle>
            <CardDescription>
              {audience.topGender.pct}% {audience.topGender.label.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {audience.ageRanges.map((a) => (
              <BarRow key={a.range} label={a.range} value={a.pct} max={maxAge} color="var(--chart-4)" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active hours</CardTitle>
            <CardDescription>When your audience is online (darker = more active)</CardDescription>
          </CardHeader>
          <CardContent>
            <Heatmap heatmap={audience.heatmap} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follower growth</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ColumnChart data={audience.followerSeries} />
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </Section>
  )
}

function Heatmap({
  heatmap,
}: {
  heatmap: { days: string[]; hourLabels: string[]; values: number[][] }
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {heatmap.values.map((row, d) => (
        <div key={heatmap.days[d]} className="flex items-center gap-2">
          <span className="w-8 shrink-0 text-[11px] text-muted-foreground">{heatmap.days[d]}</span>
          <div className="flex flex-1 gap-px">
            {row.map((intensity, h) => (
              <div
                key={h}
                className={cn('h-4 flex-1 rounded-[2px]')}
                style={{ backgroundColor: `color-mix(in oklch, var(--chart-5) ${intensity}%, var(--muted))` }}
                title={`${heatmap.days[d]} ${h}:00 — ${intensity}`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-2 pl-10 text-[10px] text-muted-foreground">
        {heatmap.hourLabels.map((h) => (
          <span key={h} className="flex-1 text-center">
            {h}
          </span>
        ))}
      </div>
    </div>
  )
}
