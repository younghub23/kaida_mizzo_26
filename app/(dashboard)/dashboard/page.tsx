import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowUpRight, Mail, Share2, Globe, TrendingUp, Plug } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewsletterSignup } from '@/components/dashboard/newsletter-signup'
import { getCalendarEvents } from '@/app/actions/calendar'
import { loadAnalytics } from '@/lib/analytics/load'
import type { Kpi, TrendPoint, Heatmap } from '@/app/(dashboard)/analytics/mock-data'
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

const microLabel = 'text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary'

// Warm card surface from the design reference: 14px radius, hairline border, an
// inset top highlight, and a gentle hover lift.
const card =
  'rounded-[14px] border border-border bg-card shadow-[0_1px_0_rgba(255,255,255,.6)_inset]'
const cardLink =
  'transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]'

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

  // Real analytics — live where a provider is connected, empty otherwise.
  // We only ever render a metric/chart whose section reports `source: 'live'`;
  // anything else shows a "connect an account" empty state (never fake numbers).
  const analytics = await loadAnalytics()
  const core = analytics.coreMetricsByNetwork.all
  const trend = analytics.trendByNetwork.all
  const audience = analytics.audienceByNetwork.all

  const kpisLive = core.source === 'live' && core.kpis.length > 0
  const trendLive = trend.source === 'live' && trend.trend.length > 0
  const audienceLive = audience.source === 'live' && audience.audience !== null

  const byKey = (k: Kpi['key']) => (kpisLive ? core.kpis.find((m) => m.key === k) : undefined)
  const followersKpi = byKey('followers')
  const clicksKpi = byKey('clicks')

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8">
        {/* ── Greeting ── */}
        <div>
          <h1 className="font-fredoka text-[34px] font-semibold leading-[1.05] tracking-[-0.01em]">
            {getGreeting()}, {businessName}
          </h1>
          <p className="mt-1.5 font-dm-serif text-lg italic text-muted-foreground">
            Here&rsquo;s what&rsquo;s happening with your brand today.
          </p>
        </div>

        {/* ── Calendar preview ── */}
        <CalendarCard items={items} />

        {/* ── Analytics + quick views ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <AnalyticsCard
            metrics={[byKey('followers'), byKey('engagementRate'), byKey('reach')]}
            kpisLive={kpisLive}
            trend={trendLive ? trend.trend : null}
            heatmap={audienceLive ? audience.audience!.heatmap : null}
          />
          <div className="flex flex-col gap-6">
            <QuickView
              href="/analytics"
              icon={<Mail className="size-5" />}
              label="Emails"
              stat="Opens & click rates"
              palette={{ bg: '#FBF0D2', border: 'rgba(244,201,109,.5)', text: '#9A6E16' }}
            />
            <QuickView
              href="/socials"
              icon={<Share2 className="size-5" />}
              label="Socials"
              stat={followersKpi ? `${formatMetric(followersKpi)} followers` : 'View analytics'}
              palette={{ bg: '#F9E4EE', border: 'rgba(214,73,140,.35)', text: '#A82C66' }}
            />
            <QuickView
              href="/analytics"
              icon={<Globe className="size-5" />}
              label="Google"
              stat={clicksKpi ? `${formatMetric(clicksKpi)} clicks` : 'View analytics'}
              palette={{ bg: '#E4F0F8', border: 'rgba(154,198,224,.55)', text: '#3A6E92' }}
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
    <Link href="/calendar" className={`group block ${card} ${cardLink} p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className={microLabel}>Calendar</span>
          <span className="font-dm-serif text-base italic text-muted-foreground">
            {formatMonthYear(now)}
          </span>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-foreground" />
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

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-border">
        {matrix.flat().map((day, idx) => {
          const inMonth = day.getMonth() === now.getMonth()
          const isToday = sameDay(day, now)
          const dayItems = itemsForDay(items, day)
          // Faint tint of the first event's category (Google-Calendar style).
          const tint = dayItems.length ? `${getCategory(dayItems[0].category).tint}77` : undefined
          return (
            <div
              key={dateKey(day)}
              className={[
                'flex min-h-[60px] flex-col gap-1 border-b border-r border-border p-1.5',
                idx % 7 === 6 ? 'border-r-0' : '',
                idx >= 35 ? 'border-b-0' : '',
                inMonth ? '' : 'bg-muted/20',
              ].join(' ')}
              style={tint ? { background: tint } : undefined}
            >
              <span
                className={[
                  'flex size-[23px] items-center justify-center self-start rounded-full font-fredoka text-[12.5px] font-semibold tabular-nums',
                  !inMonth ? 'text-muted-foreground/40' : '',
                  isToday ? 'bg-primary text-primary-foreground' : '',
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
// Category-tinted KPI colors from the reference: social / content / tangerine.
const KPI_COLORS = ['#A82C66', '#1E7B82', '#E08A3C']

function AnalyticsCard({
  metrics,
  kpisLive,
  trend,
  heatmap,
}: {
  metrics: (Kpi | undefined)[]
  kpisLive: boolean
  trend: TrendPoint[] | null
  heatmap: Heatmap | null
}) {
  const hasCharts = trend !== null || heatmap !== null

  return (
    <Link href="/analytics" className={`group block lg:col-span-2 ${card} ${cardLink} p-5`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <span className={microLabel}>General analytics</span>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-foreground" />
      </div>

      {kpisLive ? (
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <div key={m?.key ?? i}>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {m?.label ?? '—'}
              </p>
              <p
                className="mt-1 font-fredoka text-[30px] font-semibold leading-[1.1]"
                style={{ color: KPI_COLORS[i % KPI_COLORS.length] }}
              >
                {formatMetric(m)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <ConnectEmpty>
          Connect an account to see your followers, engagement rate, and reach.
        </ConnectEmpty>
      )}

      {hasCharts && (
        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          {trend && <LineChartCard trend={trend} />}
          {heatmap && <ActiveHoursCard heatmap={heatmap} />}
        </div>
      )}
    </Link>
  )
}

// Empty / "connect an account" state — shown wherever no live data exists.
function ConnectEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
      <Plug className="size-5 text-muted-foreground" />
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
        Connect an account <ArrowUpRight className="size-3" />
      </span>
    </div>
  )
}

// Engagement & reach line chart (two series, each normalized to its own range).
function LineChartCard({ trend }: { trend: TrendPoint[] }) {
  const labels = trend.map((p) => p.label)
  const eng = trend.map((p) => p.engagement)
  const reach = trend.map((p) => p.reach)
  const W = 300
  const H = 118
  const padX = 8
  const padTop = 10
  const padBot = 20
  const ix = (i: number) => padX + i * ((W - padX * 2) / Math.max(labels.length - 1, 1))
  const points = (data: number[]) => {
    const mn = Math.min(...data)
    const mx = Math.max(...data)
    const rng = mx - mn || 1
    return data.map((v, i) => ({
      x: ix(i),
      y: padTop + (1 - (v - mn) / rng) * (H - padTop - padBot),
    }))
  }
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  const ePts = points(eng)
  const rPts = points(reach)
  const engP = toPath(ePts)
  const reachP = toPath(rPts)
  const areaP = `${engP} L ${ix(labels.length - 1).toFixed(1)} ${H - padBot} L ${ix(0).toFixed(
    1
  )} ${H - padBot} Z`

  return (
    <div className="rounded-xl border border-border bg-background p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={microLabel}>Engagement &amp; reach</span>
        <div className="flex gap-2.5 text-[10.5px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <i className="size-2 rounded-full" style={{ background: '#D6498C' }} />
            Engagement
          </span>
          <span className="flex items-center gap-1">
            <i className="size-2 rounded-full" style={{ background: '#36B7C0' }} />
            Reach
          </span>
        </div>
      </div>
      <div className="h-[118px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="dashEngFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#D6498C" stopOpacity=".22" />
              <stop offset="1" stopColor="#D6498C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaP} fill="url(#dashEngFill)" />
          <path
            d={reachP}
            fill="none"
            stroke="#36B7C0"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={engP}
            fill="none"
            stroke="#D6498C"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {rPts.map((p, i) => (
            <circle key={`r${i}`} cx={p.x} cy={p.y} r={2.6} fill="#36B7C0" />
          ))}
          {ePts.map((p, i) => (
            <circle key={`e${i}`} cx={p.x} cy={p.y} r={2.6} fill="#D6498C" />
          ))}
          {labels.map((l, i) => (
            <text
              key={i}
              x={ix(i)}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 9 }}
            >
              {l}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

// Active hours bar chart — column-averaged from the audience heatmap.
function ActiveHoursCard({ heatmap }: { heatmap: Heatmap }) {
  const cols = heatmap.values[0]?.length ?? 0
  const colAvg = Array.from({ length: cols }, (_, c) => {
    const vals = heatmap.values.map((row) => row[c] ?? 0)
    return vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
  })
  const max = Math.max(...colAvg, 1)

  return (
    <div className="rounded-xl border border-border bg-background p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={microLabel}>Active hours</span>
        <span className="font-dm-serif text-[10.5px] italic text-muted-foreground">
          Peak engagement
        </span>
      </div>
      <div className="flex h-[118px] items-end gap-1.5">
        {colAvg.map((v, i) => {
          const peak = v >= max * 0.85
          const col = peak ? '#D6498C' : '#9AC6E0'
          const height = 14 + (v / max) * 86
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end">
              <div
                className="w-full max-w-[16px] rounded"
                style={{ height: `${height}%`, background: `linear-gradient(180deg,${col},${col}bb)` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[8.5px] text-muted-foreground">
        {heatmap.hourLabels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  )
}

// ── Small quick-view tile (carries its own category color) ────────────────────
function QuickView({
  href,
  icon,
  label,
  stat,
  palette,
}: {
  href: string
  icon: React.ReactNode
  label: string
  stat: string
  palette: { bg: string; border: string; text: string }
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-[14px] border p-4 ${cardLink}`}
      style={{ background: palette.bg, borderColor: palette.border }}
    >
      <span
        className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] bg-white"
        style={{ color: palette.text }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-fredoka text-base font-semibold" style={{ color: '#3A2E22' }}>
          {label}
        </p>
        <p className="truncate text-xs" style={{ color: palette.text }}>
          {stat}
        </p>
      </div>
      <ArrowUpRight
        className="size-4 transition-transform group-hover:-translate-y-px group-hover:translate-x-px"
        style={{ color: palette.text }}
      />
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
    <footer className={`mt-2 grid gap-8 ${card} p-6 sm:grid-cols-2 lg:grid-cols-4`}>
      <div className="sm:col-span-2 lg:col-span-1">
        <p className={microLabel}>Stay in the loop</p>
        <p className="mb-3 mt-2 text-sm text-muted-foreground">
          Updates, new features, and the Tala podcast — straight to your inbox.
        </p>
        {/* Client island for the input + toast. */}
        <NewsletterSignup />
      </div>

      <FooterColumn title="Navigate" color="#A82C66">
        {NAVIGATE_LINKS.map((l) => (
          <Link key={l.label} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </FooterColumn>

      <FooterColumn title="Social" color="#1E7B82">
        {SOCIAL_LINKS.map((label) => (
          <a key={label} href="#" className="hover:text-foreground">
            {label}
          </a>
        ))}
      </FooterColumn>

      <FooterColumn title="Support" color="#E08A3C">
        {SUPPORT_LINKS.map((l) => (
          <Link key={l.label} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </FooterColumn>
    </footer>
  )
}

function FooterColumn({
  title,
  color,
  children,
}: {
  title: string
  color?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p
        className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: color ?? undefined }}
      >
        {title}
      </p>
      <nav className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">{children}</nav>
    </div>
  )
}
