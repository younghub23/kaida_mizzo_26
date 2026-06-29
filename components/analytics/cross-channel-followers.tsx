import { Fingerprint, Info, Link2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { NETWORK_ICON, NETWORK_LABEL } from '@/components/analytics/network-meta'
import { sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import type { Network } from '@/app/(dashboard)/analytics/mock-data'
import type {
  MatchedPerson,
  MatchSignal,
  ConfidenceLabel,
} from '@/lib/analytics/cross-channel'

// What the strongest contributing signal means, in plain language.
const SIGNAL_REASON: Record<MatchSignal, string> = {
  handle: 'Near-identical handles',
  name: 'Near-identical display names',
  bio: 'Overlapping bio keywords',
}

// Confidence band → warm category pill. High reads as a confident olive-green,
// the lower bands cool to lemon then blush so the page never overstates an
// inferred (unconfirmed) match.
const CONFIDENCE_STYLE: Record<ConfidenceLabel, { background: string; color: string }> = {
  High: { background: '#E8EFDB', color: '#4C6633' },
  Medium: { background: '#FBF0D2', color: '#9A6E16' },
  Low: { background: '#FBE7E0', color: '#B5604A' },
}

/** Always show handles with a leading @, regardless of how the roster stored them. */
function atHandle(handle: string): string {
  return handle.startsWith('@') ? handle : `@${handle}`
}

/**
 * Section 6 — Cross-channel followers. Surfaces people who appear to follow the
 * brand on 2+ networks under near-duplicate identities (e.g. IG @jane.eyre +
 * TikTok @jane_eyre). Matching runs server-side in loadAnalytics; this component
 * only presents the result. Every match is framed as POTENTIAL, never confirmed.
 */
export function CrossChannelFollowers({
  people,
  source,
  network,
}: {
  people: MatchedPerson[]
  source: SectionSource
  network: Network
}) {
  // Respect the page-wide network filter: when a single network is selected,
  // show only people whose cross-channel overlap includes that network.
  const visible =
    network === 'all' ? people : people.filter((p) => p.platforms.includes(network))
  const linkedAccounts = visible.reduce((sum, p) => sum + p.accounts.length, 0)

  return (
    <Section
      title="Cross-channel followers"
      icon={Fingerprint}
      iconColor="#A82C66"
      eyebrow="Identity"
      source={`Cross-platform identity match ${sourceSuffix(source)}`}
      description="People who appear to follow you on more than one network under slightly different handles — surfaced as potential matches, not confirmed identities."
    >
      {source === 'empty' ? (
        <EmptyState message="Cross-channel matching needs a follower roster from a connected account — no platform exposes one yet." />
      ) : people.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No likely cross-channel followers found yet.
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No potential matches overlap {NETWORK_LABEL[network as Exclude<Network, 'all'>]} yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <PotentialMatchBanner />

          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard
              label="Potential people"
              value={visible.length}
              hint="appear to follow you on 2+ networks"
              color="#A82C66"
            />
            <SummaryCard
              label="Linked accounts"
              value={linkedAccounts}
              hint="across all matched people"
              color="#1E7B82"
            />
          </div>

          <div className="flex flex-col gap-3">
            {visible.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

/** Honest, prominent framing: inferred from public signals, not confirmed. */
function PotentialMatchBanner() {
  return (
    <div className="flex items-start gap-2.5 rounded-[14px] border border-border bg-card px-4 py-3 text-sm shadow-[0_1px_0_rgba(255,255,255,.6)_inset]">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        <span className="font-semibold">Potential matches.</span> These people are
        inferred from public profile signals (handle, name, bio) — they are{' '}
        <span className="font-medium">not confirmed identities</span>. Read the
        confidence score as a likelihood, not a fact.
      </p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  color,
}: {
  label: string
  value: number
  hint: string
  color: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription className="text-[10.5px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </CardDescription>
        <CardTitle
          className="font-fredoka text-[28px] font-semibold leading-[1.1] tabular-nums"
          style={{ color }}
        >
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </CardContent>
    </Card>
  )
}

function PersonRow({ person }: { person: MatchedPerson }) {
  const pct = Math.round(person.confidence * 100)

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{person.canonicalName}</span>
              <Badge
                variant="secondary"
                className="gap-1 border-transparent font-normal"
                style={{ background: '#E4F0F8', color: '#3A6E92' }}
              >
                <Link2 className="size-3" />
                {person.platforms.length} channels
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {SIGNAL_REASON[person.strongestSignal]}
            </span>
          </div>

          <Badge
            variant="secondary"
            className="shrink-0 gap-1.5 border-transparent"
            style={CONFIDENCE_STYLE[person.confidenceLabel]}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: CONFIDENCE_STYLE[person.confidenceLabel].color }}
            />
            {person.confidenceLabel} · {pct}% likely
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {person.accounts.map((account) => {
            const Icon = NETWORK_ICON[account.platform]
            return (
              <span
                key={`${account.platform}:${account.handle}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs"
                title={`${NETWORK_LABEL[account.platform]} · ${account.name}`}
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{NETWORK_LABEL[account.platform]}</span>
                <span className="font-medium">{atHandle(account.handle)}</span>
              </span>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
