import { Users2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { NETWORK_ICON, NETWORK_LABEL } from '@/components/analytics/network-meta'
import { getCrossChannelFollowers, type Network, type CrossChannelPerson } from '@/app/(dashboard)/analytics/mock-data'
import { formatPercent, sourceSuffix } from '@/lib/analytics/format'
import { ALLOW_MOCK_ANALYTICS } from '@/lib/analytics/config'
import { cn } from '@/lib/utils'

// Why two accounts were matched, phrased for a human.
const SIGNAL_REASON = {
  handle: 'Similar handles',
  name: 'Matching name',
  bio: 'Similar bio',
} as const

export function CrossChannelFollowers({ network }: { network: Network }) {
  const people = getCrossChannelFollowers(network)
  const accountCount = people.reduce((sum, p) => sum + p.accounts.length, 0)

  return (
    <Section
      title="Cross-channel followers"
      icon={Users2}
      source={`Per-network follower lists + identity matching ${sourceSuffix(ALLOW_MOCK_ANALYTICS ? 'mock' : 'empty')}`}
      description="The same person often follows you under slightly different handles on each platform. We match by handle, name, and bio to find who's following you across multiple channels."
    >
      {!ALLOW_MOCK_ANALYTICS ? (
        <EmptyState message="Cross-channel matches will appear once two or more accounts with follower access are connected." />
      ) : people.length === 0 ? (
        <EmptyState message="No overlapping followers found on this network yet — try the “All” filter to see everyone." />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>People on multiple channels</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{people.length}</CardTitle>
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
              <CardTitle>Matched people</CardTitle>
              <CardDescription>
                Ranked by how many channels they follow you on, then match confidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {people.map((person) => (
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
        >
          {person.confidenceLabel} · {formatPercent(person.confidence * 100, 0)}
        </Badge>
      </div>
    </div>
  )
}
