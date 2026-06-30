import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { BarRow, ColumnChart } from '@/components/analytics/charts'
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
      iconColor="#3A6E92"
      eyebrow="Demographics"
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
                <CardTitle className="font-fredoka font-semibold">Top locations</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                {audience.locations.map((l) => (
                  <BarRow key={l.country} label={l.country} value={l.pct} max={maxLoc} color="#36B7C0" />
                ))}
              </CardContent>
            </Card>
          )}

          {hasAges && (
            <Card>
              <CardHeader>
                <CardTitle className="font-fredoka font-semibold">Age ranges</CardTitle>
                {audience.topGender.label && (
                  <CardDescription>
                    {audience.topGender.pct}% {audience.topGender.label.toLowerCase()}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                {audience.ageRanges.map((a) => (
                  <BarRow key={a.range} label={a.range} value={a.pct} max={maxAge} color="#D6498C" />
                ))}
              </CardContent>
            </Card>
          )}

          {hasHours && (
            <Card>
              <CardHeader>
                <CardTitle className="font-fredoka font-semibold">Active hours</CardTitle>
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
                <CardTitle className="font-fredoka font-semibold">Follower growth</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ColumnChart data={audience.followerSeries} color="#E08A3C" />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </Section>
  )
}

// Multi-hue intensity ramp (low → high), matching the mockup: cool cream-blue
// through turquoise into warm lemon/tangerine/bougainvillea. Pure + deterministic
// — driven only by the real GA4 matrix value, never a generated intensity.
const HEAT_STOPS = ['#E4F0F8', '#9AC6E0', '#36B7C0', '#F4C96D', '#E08A3C', '#D6488C']

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function heatColor(intensity: number): string {
  const t = Math.min(100, Math.max(0, intensity)) / 100
  const seg = t * (HEAT_STOPS.length - 1)
  const i = Math.min(HEAT_STOPS.length - 2, Math.floor(seg))
  const f = seg - i
  const a = hexToRgb(HEAT_STOPS[i])
  const b = hexToRgb(HEAT_STOPS[i + 1])
  const ch = (k: number) => Math.round(a[k] + (b[k] - a[k]) * f)
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
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
                // Multi-hue ramp keyed off the real GA4 intensity (0–100): cool
                // cream-blue at low activity, warming to bougainvillea at peak.
                style={{ backgroundColor: heatColor(intensity) }}
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
