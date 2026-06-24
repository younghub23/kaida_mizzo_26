import { Users2, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { NETWORK_ICON, NETWORK_LABEL } from '@/components/analytics/network-meta'
import { type Network } from '@/app/(dashboard)/analytics/mock-data'
import { type CrossChannelPerson } from '@/lib/analytics/cross-channel'
import { formatPercent, sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'

// Why two accounts were matched, phrased for a human.
const SIGNAL_REASON = {
  handle: 'Similar handle',
  name: 'Similar name',
  bio: 'Similar bio',
} as const

export function CrossChannelFollowers({
  people,
  source,
  network,
}: {
  people: CrossChannelPerson[]
  source: SectionSource
  network: Network
}) {
  // The matched set is cross-network; when a single network is selected, narrow
  // to people whose multi-channel presence includes it ("follows me here AND
  // elsewhere") so the page-wide filter still applies.
  const visible =
    network === 'all' ? people : people.filter((p) => p.platforms.includes(network))
  const accountCount = visible.reduce((sum, p) => sum + p.accounts.length, 0)

  return (
    <Section
      title="Cross-channel followers"
      icon={Users2}
      source={`Follower rosters + identity matching ${sourceSuffix(source)}`}
      description="The same person often follows you under slightly different handles on each platform. We flag likely overlaps by comparing handle, name, and bio."
    >
      {source === 'empty' ? (
        <EmptyState message="Cross-channel matches will appear once accounts that expose their follower rosters are connected." />
      ) : visible.length === 0 ? (
        <EmptyState message="No likely cross-channel followers on this network — switch to “All” to see everyone." />
      ) : (
        <div className="flex flex-col gap-4">
          {/* These are inferred, not confirmed — make that unmistakable. */}
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-medium text-foreground">Potential matches.</span>{' '}
              These are likely the same person based on similar handles, names, and
              bios — not confirmed identities. Review before acting on them.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Potential cross-channel people</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{visible.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Linked accounts</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{accountCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Potential matches</CardTitle>
              <CardDescription>
                Ranked by how many channels they likely follow you on, then match
                confidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {visible.map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </Section>
  )
}

function PersonRow({ person }: { person: CrossChannelPerson }) {
  const initials = person.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {initials || '?'}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{person.name}</span>
            <Badge variant="secondary" className="font-normal">
              {person.platforms.length} channels
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {person.accounts.map((account) => {
              const Icon = NETWORK_ICON[account.platform]
              return (
                <span
                  key={`${account.platform}:${account.handle}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                  title={NETWORK_LABEL[account.platform]}
                >
                  <Icon className="size-3 shrink-0" />
                  @{account.handle}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
        <span className="text-xs text-muted-foreground">{SIGNAL_REASON[person.topSignal]}</span>
        <Badge
          variant={person.confidenceLabel === 'High' ? 'default' : 'outline'}
          className={cn('tabular-nums', person.confidenceLabel === 'High' && 'bg-emerald-600 hover:bg-emerald-600')}
          title="Estimated likelihood these accounts are the same person"
        >
          {person.confidenceLabel} · {formatPercent(person.confidence * 100, 0)} likely
        </Badge>
      </div>
    </div>
  )
}
