import { Clock, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { NETWORKS, REAL_NETWORKS, type Network, type TimeSlot } from '@/app/(dashboard)/analytics/mock-data'
import { NETWORK_LABEL, NETWORK_ICON } from '@/components/analytics/network-meta'
import { sourceSuffix, type SectionSource } from '@/lib/analytics/format'

export function BestTimes({
  network,
  bestTimesByNetwork,
}: {
  network: Network
  // Per-network windows derived from each account's real engagement history
  // (live), mock in dev, or empty until that account has published posts.
  bestTimesByNetwork: Record<Network, { slots: TimeSlot[]; source: SectionSource }>
}) {
  // When viewing "All", show every platform that has data; otherwise the one.
  const platforms = (network === 'all' ? REAL_NETWORKS : [network]) as Exclude<Network, 'all'>[]
  const visible = platforms.filter((p) => bestTimesByNetwork[p]?.slots.length > 0)
  const networkLabel = NETWORKS.find((n) => n.id === network)?.label ?? 'All'

  // Aggregate source for the badge: live if any window is live, else mock, else empty.
  const sources = platforms.map((p) => bestTimesByNetwork[p]?.source)
  const source: SectionSource = sources.includes('live')
    ? 'live'
    : sources.includes('mock')
      ? 'mock'
      : 'empty'

  return (
    <Section
      title="Best time to post"
      icon={Clock}
      source={`Per-account engagement history ${sourceSuffix(source)}`}
      description="Recommended posting windows derived from when your published posts earned the most engagement, per platform."
    >
      {visible.length === 0 ? (
        <EmptyState message="Best-time recommendations appear once you have published posts with engagement history." />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              Recommended posting windows for{' '}
              <span className="font-medium text-foreground">{networkLabel}</span>, from your real engagement:
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => {
                const Icon = NETWORK_ICON[p]
                const slots = bestTimesByNetwork[p].slots
                return (
                  <div key={p} className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="size-4 text-primary" />
                      {NETWORK_LABEL[p]}
                    </div>
                    <div className="flex flex-col gap-2">
                      {slots.map((slot) => (
                        <div key={`${slot.day}-${slot.time}`} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-sm">
                            {slot.day} · {slot.time}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${slot.score}%`,
                                background: 'linear-gradient(90deg,#D6498C,#E08A3C)',
                              }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            {slot.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </Section>
  )
}
