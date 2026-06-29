import Link from 'next/link'
import { Ear, Lock, Smile, Meh, Frown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { type Mention, type ListeningData } from '@/app/(dashboard)/analytics/mock-data'
import { formatCompact, formatDelta, sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import { PLAN_LABELS, PLAN_FEATURES } from '@/lib/analytics/plan'

const TIER_NAMES = PLAN_FEATURES.socialListening.tiers.map((t) => PLAN_LABELS[t]).join(' & ')

const SENTIMENT_META = {
  positive: { label: 'Positive', icon: Smile, color: '#4C6633' }, // warm olive green
  neutral: { label: 'Neutral', icon: Meh, color: '#9AC6E0' }, // sky blue
  negative: { label: 'Negative', icon: Frown, color: '#C8472E' }, // rust
} as const

export function SocialListening({
  data,
  source,
  unlocked,
}: {
  // Brand-level — live once a brand-monitoring integration is configured.
  data: ListeningData | null
  source: SectionSource
  unlocked: boolean
}) {
  return (
    <Section
      title="Social listening &amp; sentiment"
      icon={Ear}
      source={`Listening provider + Claude sentiment ${sourceSuffix(unlocked ? source : 'empty')}`}
      description="Brand-mention monitoring and sentiment across the web."
      action={
        <Badge variant={unlocked ? 'secondary' : 'outline'}>
          Enterprise · {TIER_NAMES}
        </Badge>
      }
    >
      {unlocked ? <UnlockedListening data={data} /> : <LockedListening />}
    </Section>
  )
}

function UnlockedListening({ data }: { data: ListeningData | null }) {
  // Real-or-empty: no fabricated mentions are ever shown.
  if (!data) {
    return <EmptyState message="Social listening requires a brand-monitoring integration (not connected yet)." />
  }

  const up = data.deltaPct >= 0

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription className="text-[10.5px] font-semibold uppercase tracking-[0.12em]">
            Total mentions
          </CardDescription>
          <CardTitle
            className="font-fredoka text-[28px] font-semibold leading-[1.1] tabular-nums"
            style={{ color: '#A82C66' }}
          >
            {formatCompact(data.totalMentions)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <span style={{ color: up ? '#4C6633' : '#C8472E' }}>
            {formatDelta(data.deltaPct)} vs last period
          </span>
          <span className="text-muted-foreground">{data.shareOfVoicePct}% share of voice</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-fredoka font-semibold">Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex h-2.5 overflow-hidden rounded-full">
            {(['positive', 'neutral', 'negative'] as const).map((k) => (
              <div key={k} style={{ width: `${data.sentiment[k]}%`, backgroundColor: SENTIMENT_META[k].color }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {(['positive', 'neutral', 'negative'] as const).map((k) => {
              const Icon = SENTIMENT_META[k].icon
              return (
                <div key={k} className="flex flex-col items-center gap-1">
                  <Icon className="size-4" />
                  <span className="font-medium">{data.sentiment[k]}%</span>
                  <span className="text-muted-foreground">{SENTIMENT_META[k].label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="font-fredoka font-semibold">Recent mentions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.mentions.map((m) => (
            <MentionRow key={m.id} mention={m} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function MentionRow({ mention }: { mention: Mention }) {
  const meta = SENTIMENT_META[mention.sentiment]
  const Icon = meta.icon
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-2 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0" style={{ color: meta.color }} />
      <div className="flex-1">
        <p>{mention.text}</p>
        <p className="text-xs text-muted-foreground">
          {mention.author} · {mention.source} · {mention.at}
        </p>
      </div>
    </div>
  )
}

/**
 * Locked state for Starter & Growth. We intentionally render only a blurred
 * teaser with placeholder shapes — the real (mock) listening data is never
 * fetched or shipped to lower tiers.
 */
function LockedListening() {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="py-8">
        {/* Obscured teaser — no real data, purely decorative skeleton. */}
        <div aria-hidden className="pointer-events-none grid select-none gap-4 blur-sm lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-6 w-16 rounded bg-muted" />
              <div className="h-2.5 w-full rounded-full bg-muted" />
              <div className="h-2.5 w-3/4 rounded-full bg-muted" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 p-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-fredoka text-base font-semibold">Available on {TIER_NAMES}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Social listening &amp; sentiment is an enterprise feature. Upgrade to monitor brand mentions and track sentiment across the web.
            </p>
          </div>
          <Button
            asChild
            className="border-0 text-white transition-[filter] hover:brightness-105"
            style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
          >
            <Link href="/plan">Upgrade</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
