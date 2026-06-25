import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowUpRight,
  Mail,
  Share2,
  Globe,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewsletterSignup } from '@/components/dashboard/newsletter-signup'
import { getCalendarEvents } from '@/app/actions/calendar'
import { getCoreMetrics, getAudience, type Kpi } from '@/app/(dashboard)/analytics/mock-data'
import { getCategory } from '@/app/(dashboard)/calendar/categories'
import {
  normalizeEvents,
  getMonthMatrix,
  itemsForDay,
  sameDay,
  dateKey,
  formatMonthYear,
  WEEKDAY_LABELS,
  type CalendarItem,
} from '@/app/(dashboard)/calendar/calendar-utils'

const microLabel = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-primary'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function compact(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function formatMetric(kpi: Kpi | undefined): string {
  if (!kpi) return '—'
  return kpi.format === 'percent' ? `${kpi.value}%` : compact(kpi.value)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const businessName = profile?.full_name ?? 'there'

  const events = await getCalendarEvents()
  const items = normalizeEvents(events)

  // Analytics quick-view figures (placeholder data — see analytics/mock-data).
  const metrics = getCoreMetrics('all')
  const byKey = (k: Kpi['key']) => metrics.find((m) => m.key === k)
  const followerSeries = getAudience('all').followerSeries

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        {/* ── Greeting ── */}
        <div>
          <h1 className="font-fredoka text-3xl font-semibold tracking-tight">
            {getGreeting()}, {businessName}
          </h1>
          <p className="mt-0.5 font-dm-serif text-xl italic text-muted-foreground">
            Here&rsquo;s what&rsquo;s happening with your brand today.
          </p>
        </div>

        {/* ── Calendar preview ── */}
        <CalendarCard items={items} />

        {/* ── Analytics + quick views ── */}
        <div className="grid gap-5 lg:grid-cols-3">
          <AnalyticsCard
            metrics={[byKey('followers'), byKey('engagementRate'), byKey('reach')]}
            series={followerSeries}
          />
          <div className="flex flex-col gap-5">
            <QuickView
              href="/analytics"
              icon={<Mail className="size-5" />}
              label="Emails"
              stat="Opens & click rates"
            />
            <QuickView
              href="/socials"
              icon={<Share2 className="size-5" />}
              label="Socials"
              stat={`${formatMetric(byKey('followers'))} followers`}
            />
            <QuickView
              href="/analytics"
              icon={<Globe className="size-5" />}
              label="Google"
              stat={`${formatMetric(byKey('clicks'))} clicks`}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <DashboardFooter />
      </div>
    </div>
  )
}

// ── Calendar preview (links to /calendar) ─────────────────────────────────────
function CalendarCard({ items }: { items: CalendarItem[] }) {
  const now = new Date()
  const matrix = getMonthMatrix(now.getFullYear(), now.getMonth())

  return (
    <Link
      href="/calendar"
      className="group block rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-colors hover:border-primary/40"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className={microLabel}>Calendar</span>
          <span className="font-dm-serif text-base italic text-muted-foreground">
            {formatMonthYear(now)}
          </span>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-primary"
          >
            {d[0]}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-border">
        {matrix.flat().map((day, idx) => {
          const inMonth = day.getMonth() === now.getMonth()
          const isToday = sameDay(day, now)
          const dayItems = itemsForDay(items, day)
          return (
            <div
              key={dateKey(day)}
              className={[
                'flex min-h-[60px] flex-col gap-1 border-b border-r border-border p-1.5',
                idx % 7 === 6 ? 'border-r-0' : '',
                idx >= 35 ? 'border-b-0' : '',
                inMonth ? '' : 'bg-muted/20',
              ].join(' ')}
            >
              <span
                className={[
                  'flex size-5 items-center justify-center self-start rounded-full font-fredoka text-[11px] tabular-nums',
                  !inMonth ? 'text-muted-foreground/40' : '',
                  isToday ? 'bg-primary font-semibold text-primary-foreground' : '',
                ].join(' ')}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-wrap gap-1">
                {dayItems.slice(0, 4).map((it) => (
                  <span
                    key={it.id}
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: getCategory(it.category).color }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Link>
  )
}

// ── General analytics (links to /analytics) ───────────────────────────────────
function AnalyticsCard({
  metrics,
  series,
}: {
  metrics: (Kpi | undefined)[]
  series: { label: string; value: number }[]
}) {
  const max = Math.max(...series.map((s) => s.value), 1)

  return (
    <Link
      href="/analytics"
      className="group block rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-colors hover:border-primary/40 lg:col-span-2"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <span className={microLabel}>General analytics</span>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <div key={m?.key ?? i}>
            <p className="text-xs text-muted-foreground">{m?.label ?? '—'}</p>
            <p className="font-fredoka text-2xl font-semibold">{formatMetric(m)}</p>
          </div>
        ))}
      </div>

      {/* Follower trend, last 6 months. */}
      <div className="flex h-28 items-end gap-2">
        {series.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="w-full rounded-t-sm bg-primary/70 transition-colors group-hover:bg-primary"
              style={{ height: `${Math.max((point.value / max) * 100, 4)}%` }}
            />
            <span className="text-[10px] text-muted-foreground">{point.label}</span>
          </div>
        ))}
      </div>
    </Link>
  )
}

// ── Small quick-view tile ─────────────────────────────────────────────────────
function QuickView({
  href,
  icon,
  label,
  stat,
}: {
  href: string
  icon: React.ReactNode
  label: string
  stat: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5 transition-colors hover:border-primary/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-fredoka text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{stat}</p>
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
const NAVIGATE_LINKS = [
  { href: '/calendar', label: 'Calendar' },
  { href: '/socials', label: 'Socials' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/ai', label: 'AI Assistant' },
  { href: '/about', label: 'Our story' },
]

const SOCIAL_LINKS = ['Instagram', 'YouTube', 'TikTok', 'Pinterest', 'LinkedIn', 'Facebook']

const SUPPORT_LINKS = [
  { href: '/about', label: 'Help center' },
  { href: '/about', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
]

function DashboardFooter() {
  return (
    <footer className="mt-2 grid gap-8 rounded-xl border border-border bg-card p-6 ring-1 ring-foreground/5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <p className={microLabel}>Stay in the loop</p>
        <p className="mb-3 mt-2 text-sm text-muted-foreground">
          Updates, new features, and the Tala podcast — straight to your inbox.
        </p>
        {/* Client island for the input + toast. */}
        <NewsletterSignup />
      </div>

      <FooterColumn title="Navigate">
        {NAVIGATE_LINKS.map((l) => (
          <Link key={l.label} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </FooterColumn>

      <FooterColumn title="Social">
        {SOCIAL_LINKS.map((label) => (
          <a key={label} href="#" className="hover:text-foreground">
            {label}
          </a>
        ))}
      </FooterColumn>

      <FooterColumn title="Support">
        {SUPPORT_LINKS.map((l) => (
          <Link key={l.label} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </FooterColumn>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={microLabel}>{title}</p>
      <nav className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">{children}</nav>
    </div>
  )
}
