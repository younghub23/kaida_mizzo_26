import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { BarRow, ColumnChart } from '@/components/analytics/charts'
import { ACCENTS } from '@/components/analytics/palette'
import { type AudienceData } from '@/app/(dashboard)/analytics/mock-data'
import { sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'

export function AudienceInsights({
  audience,
  source,
}: {
  // Live where a provider (GA4) supplies it, mock in dev, null/empty otherwise.
  audience: AudienceData | null
  source: SectionSource
}) {
  // Only render the sub-cards a real source actually populated — never a card
  // with no data.
  const hasLocations = !!audience && audience.locations.length > 0
  const hasAges = !!audience && audience.ageRanges.length > 0
  const hasHours = !!audience && audience.heatmap.values.some((row) => row.some((v) => v > 0))
  const hasFollowers = !!audience && audience.followerSeries.length > 0
  const hasAny = hasLocations || hasAges || hasHours || hasFollowers

  const maxLoc = hasLocations ? Math.max(...audience!.locations.map((l) => l.pct)) : 0
  const maxAge = hasAges ? Math.max(...audience!.ageRanges.map((a) => a.pct)) : 0

  return (
    <Section
      title="Audience insights"
      icon={Users}
      source={`GA4 + network audience APIs ${sourceSuffix(source)}`}
      description="Who you're reaching — location, age, gender, active hours, and follower growth over time."
    >
      {!audience || !hasAny ? (
        <EmptyState message="Audience demographics will appear once an account with audience insights (e.g. GA4) is connected and has visitors." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {hasLocations && (
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
          )}

          {hasAges && (
            <Card>
              <CardHeader>
                <CardTitle>Age ranges</CardTitle>
                {audience.topGender.label && (
                  <CardDescription>
                    {audience.topGender.pct}% {audience.topGender.label.toLowerCase()}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                {audience.ageRanges.map((a) => (
                  <BarRow key={a.range} label={a.range} value={a.pct} max={maxAge} color="var(--chart-4)" />
                ))}
              </CardContent>
            </Card>
          )}

          {hasHours && (
            <Card>
              <CardHeader>
                <CardTitle>Active hours</CardTitle>
                <CardDescription>When your audience is online (darker = more active)</CardDescription>
              </CardHeader>
              <CardContent>
                <Heatmap heatmap={audience.heatmap} />
              </CardContent>
            </Card>
          )}

          {hasFollowers && (
            <Card>
              <CardHeader>
                <CardTitle>Follower growth</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ColumnChart data={audience.followerSeries} colors={ACCENTS} />
              </CardContent>
            </Card>
          )}
        </div>
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
