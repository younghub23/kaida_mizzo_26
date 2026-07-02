import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowUpRight,
  Users,
  Eye,
  Activity,
  CalendarClock,
  Plus,
  Sparkles,
  Plug,
  Share2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NewsletterSignup } from '@/components/dashboard/newsletter-signup'
import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar'
import { getCalendarEvents } from '@/app/actions/calendar'
import { getPosts, type ScheduledPost } from '@/app/actions/social'
import { loadAnalytics } from '@/lib/analytics/load'
import type { Kpi } from '@/app/(dashboard)/analytics/mock-data'
import { REAL_NETWORKS, type RealNetwork } from '@/app/(dashboard)/analytics/mock-data'
import { getCategory } from '@/app/(dashboard)/calendar/categories'
import { formatRelative } from '@/app/(dashboard)/calendar/calendar-utils'
import { PLATFORMS, isPlatformId } from '@/lib/socials/platforms'
import { BrandLogo } from '@/components/socials/brand-logo'
import { microLabel, card, cardLink } from '@/app/(dashboard)/profile/ui'
import { isCreator } from '@/lib/account'
import { RecommendedRail } from '@/components/marketplace/recommended-rail'
import CreatorDashboard from './creator-dashboard'

// Status pill palette (scheduled → content / draft → work), from the category table.
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: '#DCF1F2', text: '#1E7B82', label: 'Scheduled' },
  draft: { bg: '#E4F0F8', text: '#3A6E92', label: 'Draft' },
}

// Per-network bar gradient + label for Channel performance (brand colors only —
// the numbers themselves all come from live analytics).
const NETWORK_BRAND: Record<RealNetwork, { label: string; bar: string }> = {
  instagram: { label: 'Instagram', bar: 'linear-gradient(90deg,#fd5949,#d6249f)' },
  facebook: { label: 'Facebook', bar: 'linear-gradient(90deg,#18ACFE,#0866FF)' },
  linkedin: { label: 'LinkedIn', bar: 'linear-gradient(90deg,#0A66C2,#004182)' },
  tiktok: { label: 'TikTok', bar: 'linear-gradient(90deg,#25F4EE,#FE2C55)' },
  youtube: { label: 'YouTube', bar: 'linear-gradient(90deg,#FF4E45,#CC0000)' },
  pinterest: { label: 'Pinterest', bar: 'linear-gradient(90deg,#E60023,#AD081B)' },
  snapchat: { label: 'Snapchat', bar: 'linear-gradient(90deg,#FFFC00,#F7B500)' },
  google: { label: 'Google', bar: 'linear-gradient(90deg,#4285F4,#34A853)' },
}

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

// "Today" / "Tomorrow" / weekday for the upcoming-post day label.
function dayLabel(d: Date, now: Date): string {
  const oneDay = 86_400_000
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((startD - startToday) / oneDay)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Creators get their own trimmed home; everything below is the unchanged
  // business dashboard.
  if (isCreator(user)) {
    return <CreatorDashboard user={user} />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const businessName = profile?.full_name ?? 'there'

  const [events, posts] = await Promise.all([getCalendarEvents(), getPosts()])

  // Real analytics — live where a provider is connected, empty otherwise. We
  // only ever render a metric/series whose section reports `source: 'live'`;
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
  const reachKpi = byKey('reach')
  const engagementKpi = byKey('engagementRate')

  // Real sparkline series (only when their section is live).
  const reachSeries = trendLive ? trend.trend.map((p) => p.reach) : null
  const engagementSeries = trendLive ? trend.trend.map((p) => p.engagement) : null
  const followerSeries = audienceLive
    ? audience.audience!.followerSeries.map((p) => p.value)
    : null

  const now = new Date()

  // Scheduled-posts KPI: real count + soonest upcoming time (no fabricated delta).
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled')
  const nextScheduled = scheduledPosts
    .filter((p) => new Date(p.scheduled_at).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]

  // Upcoming posts list: future scheduled/draft, soonest first.
  const upcoming = posts
    .filter(
      (p) =>
        (p.status === 'scheduled' || p.status === 'draft') &&
        new Date(p.scheduled_at).getTime() >= now.getTime()
    )
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 4)

  // Channel performance: one row per connected channel with live follower data.
  const channelRows = REAL_NETWORKS.map((net) => {
    const section = analytics.coreMetricsByNetwork[net]
    if (section.source !== 'live') return null
    const followers = section.kpis.find((k) => k.key === 'followers')
    if (!followers) return null
    const growth = section.kpis.find((k) => k.key === 'followerGrowth')
    return {
      net,
      value: followers.value,
      deltaPct: followers.deltaPct ?? growth?.deltaPct ?? null,
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)
  const channelMax = Math.max(...channelRows.map((r) => r.value), 1)

  // Recent activity: real history only — published posts + already-created
  // calendar events. No sample feed rows.
  const activity = [
    ...posts
      .filter((p) => p.status === 'published')
      .map((p) => ({
        ts: new Date(p.scheduled_at),
        category: 'social',
        text: `Published${p.platforms.length ? ` to ${p.platforms.map(platformLabel).join(', ')}` : ''}`,
        detail: p.content,
      })),
    ...events
      .map((e) => ({
        ts: new Date(e.created_at),
        category: e.category,
        text: e.title,
        detail: 'Added to your calendar',
      }))
      .filter((a) => a.ts.getTime() <= now.getTime()),
  ]
    .sort((a, b) => b.ts.getTime() - a.ts.getTime())
    .slice(0, 5)

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-8 pb-16 pt-8">
        {/* ── Page header ── */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-fredoka text-[34px] font-semibold leading-[1.05] tracking-[-0.01em]">
              {getGreeting()}, {businessName}
            </h1>
            <p className="mt-1.5 font-dm-serif text-lg italic text-primary">
              Here&rsquo;s what&rsquo;s happening with your brand today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/socials"
              className="inline-flex items-center gap-2 rounded-[11px] px-4 py-2.5 font-fredoka text-[13.5px] font-medium text-white shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105"
              style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
            >
              <Plus className="size-4" />
              New post
            </Link>
            <Link
              href="/ai"
              className="inline-flex items-center gap-2 rounded-[11px] border border-[rgba(164,141,120,.34)] bg-card px-4 py-2.5 font-fredoka text-[13.5px] font-medium text-foreground transition-colors hover:border-primary hover:bg-accent"
            >
              <Sparkles className="size-4 text-[#D6488C]" />
              Draft with AI
            </Link>
          </div>
        </div>

        {/* ── Month calendar ── */}
        <DashboardCalendar events={events} posts={posts} />

        {/* ── Stats row ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpisLive ? (
            <>
              <StatCard
                label="Total followers"
                icon={<Users className="size-4" />}
                iconGradient="linear-gradient(135deg,#D6488C,#C8472E)"
                value={formatMetric(followersKpi)}
                deltaPct={followersKpi?.deltaPct ?? null}
                series={followerSeries}
                seriesColor="#D6498C"
              />
              <StatCard
                label="Reach"
                icon={<Eye className="size-4" />}
                iconGradient="linear-gradient(135deg,#36B7C0,#1E7B82)"
                value={formatMetric(reachKpi)}
                deltaPct={reachKpi?.deltaPct ?? null}
                series={reachSeries}
                seriesColor="#36B7C0"
              />
              <StatCard
                label="Engagement rate"
                icon={<Activity className="size-4" />}
                iconGradient="linear-gradient(135deg,#F4C96D,#E08A3C)"
                value={formatMetric(engagementKpi)}
                deltaPct={engagementKpi?.deltaPct ?? null}
                series={engagementSeries}
                seriesColor="#E0A23C"
              />
            </>
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
              <ConnectEmpty>
                Connect an account to see your followers, reach, and engagement.
              </ConnectEmpty>
            </div>
          )}

          {/* Scheduled posts is always real (a count of your own posts). */}
          <StatCard
            label="Scheduled posts"
            icon={<CalendarClock className="size-4" />}
            iconGradient="linear-gradient(135deg,#9AC6E0,#3A6E92)"
            value={`${scheduledPosts.length}`}
            note={
              nextScheduled
                ? `Next ${formatRelative(new Date(nextScheduled.scheduled_at), now).toLowerCase()}`
                : 'None scheduled yet'
            }
          />
        </div>

        {/* ── Two-column grid ── */}
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_336px]">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            {/* Upcoming posts */}
            <div className={`${card} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <span className="font-fredoka text-base font-semibold">Upcoming posts</span>
                <Link
                  href="/calendar"
                  className="font-fredoka text-[12.5px] font-medium text-primary hover:text-[#8A715C]"
                >
                  View calendar →
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <div className="px-5 py-10">
                  <ConnectEmpty icon={<CalendarClock className="size-5 text-muted-foreground" />}>
                    Nothing scheduled yet. Draft a post to fill your calendar.
                  </ConnectEmpty>
                </div>
              ) : (
                upcoming.map((post) => <UpcomingRow key={post.id} post={post} now={now} />)
              )}
            </div>

            {/* Channel performance */}
            <div className={`${card} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <span className="font-fredoka text-base font-semibold">Channel performance</span>
                <span className="text-[12.5px] text-muted-foreground">Followers</span>
              </div>
              {channelRows.length === 0 ? (
                <div className="px-5 py-10">
                  <ConnectEmpty>
                    Connect a channel to compare your follower counts side by side.
                  </ConnectEmpty>
                </div>
              ) : (
                channelRows.map((row) => {
                  const brand = NETWORK_BRAND[row.net]
                  return (
                    <div
                      key={row.net}
                      className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0"
                    >
                      <span className="w-[88px] shrink-0 font-fredoka text-[13.5px] font-semibold">
                        {brand.label}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-accent">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max((row.value / channelMax) * 100, 4)}%`,
                            background: brand.bar,
                          }}
                        />
                      </div>
                      <span className="w-[104px] shrink-0 text-right">
                        <span className="font-fredoka text-[13px] font-semibold">
                          {compact(row.value)}
                        </span>
                        {row.deltaPct != null && (
                          <span className="ml-1 text-[11px] font-semibold text-[#1E7B82]">
                            {row.deltaPct >= 0 ? '+' : ''}
                            {row.deltaPct}%
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* AI assistant */}
            <div
              className="overflow-hidden rounded-[14px] border"
              style={{
                borderColor: 'rgba(214,72,140,.22)',
                background: 'linear-gradient(165deg,rgba(214,72,140,.07),rgba(224,138,60,.05))',
              }}
            >
              <div className="flex items-center gap-3 px-5 pb-3.5 pt-[18px]">
                <span
                  className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] text-white shadow-[0_3px_10px_rgba(200,71,46,.28)]"
                  style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
                >
                  <Sparkles className="size-[18px]" />
                </span>
                <div>
                  <h3 className="font-fredoka text-[15.5px] font-semibold">From your assistant</h3>
                  <p className="font-dm-serif text-[11.5px] italic text-muted-foreground">
                    Ideas tuned to your brand
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 px-5 pb-4">
                {AI_PROMPTS.map((prompt) => (
                  <Link
                    key={prompt.tag}
                    href="/ai"
                    className="rounded-[11px] border border-border bg-card px-3.5 py-3 text-[13px] leading-snug text-foreground transition-[transform,border-color] hover:-translate-y-px hover:border-primary"
                  >
                    <span className="mb-1.5 block font-fredoka text-[10px] font-semibold uppercase tracking-[0.06em] text-[#A82C66]">
                      {prompt.tag}
                    </span>
                    {prompt.text}
                  </Link>
                ))}
              </div>
              <Link
                href="/ai"
                className="mx-5 mb-[18px] flex items-center justify-center gap-2 rounded-[11px] px-4 py-2.5 font-fredoka text-[13.5px] font-medium text-white shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105"
                style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
              >
                <Sparkles className="size-4" />
                Generate a post
              </Link>
            </div>

            {/* Recent activity */}
            <div className={`${card} overflow-hidden`}>
              <div className="border-b border-border px-5 py-4">
                <span className="font-fredoka text-base font-semibold">Recent activity</span>
              </div>
              {activity.length === 0 ? (
                <div className="px-5 py-10">
                  <ConnectEmpty icon={<Activity className="size-5 text-muted-foreground" />}>
                    Your published posts and calendar updates will show up here.
                  </ConnectEmpty>
                </div>
              ) : (
                activity.map((a, i) => (
                  <div key={i} className="flex gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
                    <span
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getCategory(a.category).color }}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-snug text-foreground">
                        <span className="font-fredoka font-semibold">{a.text}</span>
                        {a.detail ? <span className="text-muted-foreground"> — {a.detail}</span> : null}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatRelative(a.ts, now)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Recommended for you ── */}
        <RecommendedRail user={user} />

        {/* ── Footer ── */}
        <DashboardFooter />
      </div>
    </div>
  )
}

// Two-word labels for platform codes (real connected platforms only).
function platformLabel(p: string): string {
  return isPlatformId(p) ? PLATFORMS[p].label : p.charAt(0).toUpperCase() + p.slice(1)
}

// Generic, non-fabricated assistant prompts (no invented analytics claims).
const AI_PROMPTS = [
  { tag: 'Draft', text: 'Draft a caption for your next post in your brand voice.' },
  { tag: 'Plan', text: 'Ask your assistant for the best times to post this week.' },
]

// ── KPI stat card ──────────────────────────────────────────────────────────
function StatCard({
  label,
  icon,
  iconGradient,
  value,
  deltaPct = null,
  note,
  series,
  seriesColor = '#D6498C',
}: {
  label: string
  icon: React.ReactNode
  iconGradient: string
  value: string
  deltaPct?: number | null
  note?: string
  series?: number[] | null
  seriesColor?: string
}) {
  return (
    <div className={`${card} ${cardLink} flex flex-col gap-2.5 p-[18px]`}>
      <div className="flex items-center justify-between">
        <span className={microLabel}>{label}</span>
        <span
          className="flex size-[30px] items-center justify-center rounded-[9px] text-white"
          style={{ background: iconGradient }}
        >
          {icon}
        </span>
      </div>
      <div className="font-fredoka text-[32px] font-semibold leading-none tracking-[-0.01em]">
        {value}
      </div>
      {/* Delta chip only when a real period-over-period value exists. */}
      {deltaPct != null ? (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-[7px] px-1.5 py-0.5 font-fredoka text-xs font-semibold"
            style={
              deltaPct >= 0
                ? { color: '#1E7B82', background: '#DCF1F2' }
                : { color: '#C8472E', background: '#F9E1DA' }
            }
          >
            {deltaPct >= 0 ? '+' : ''}
            {deltaPct}%
          </span>
          <span className="text-[11.5px] text-muted-foreground">vs last period</span>
        </div>
      ) : note ? (
        <span className="text-[11.5px] text-muted-foreground">{note}</span>
      ) : null}
      {series && series.length > 1 && <Sparkline points={series} color={seriesColor} />}
    </div>
  )
}

// Tiny inline sparkline normalized to its own range (real series only).
function Sparkline({ points, color }: { points: number[]; color: string }) {
  const W = 200
  const H = 30
  const min = Math.min(...points)
  const max = Math.max(...points)
  const rng = max - min || 1
  const step = W / Math.max(points.length - 1, 1)
  const d = points
    .map((v, i) => `${(i * step).toFixed(1)},${(H - ((v - min) / rng) * (H - 6) - 3).toFixed(1)}`)
    .join(' ')
  return (
    <svg className="block h-[30px] w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={d}
      />
    </svg>
  )
}

// ── Upcoming post row ────────────────────────────────────────────────────────
function UpcomingRow({ post, now }: { post: ScheduledPost; now: Date }) {
  const platform = post.platforms[0]
  const known = platform && isPlatformId(platform) ? PLATFORMS[platform] : null
  const start = new Date(post.scheduled_at)
  const status = STATUS_STYLES[post.status] ?? STATUS_STYLES.scheduled

  return (
    <div className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-accent/40">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-[11px] p-2 text-white shadow-[0_2px_8px_rgba(58,46,34,.14)]"
        style={{ background: known ? known.gradient : 'linear-gradient(135deg,#A48D78,#8A715C)' }}
      >
        {platform && isPlatformId(platform) ? <BrandLogo id={platform} /> : <Share2 className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] leading-tight text-foreground">
          {post.content || 'Untitled post'}
        </p>
        <p className="mt-0.5 font-fredoka text-[11.5px] font-medium text-muted-foreground">
          {known ? `${known.label} · ${known.postType}` : platformLabel(platform ?? 'Post')}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-fredoka text-[13px] font-semibold">
          {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>
        <div className="text-[11px] text-muted-foreground">{dayLabel(start, now)}</div>
      </div>
      <span
        className="shrink-0 rounded-[6px] px-2 py-1 font-fredoka text-[10px] font-semibold uppercase tracking-[0.05em]"
        style={{ background: status.bg, color: status.text }}
      >
        {status.label}
      </span>
    </div>
  )
}

// Empty / "connect an account" state — shown wherever no live data exists.
function ConnectEmpty({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
      {icon ?? <Plug className="size-5 text-muted-foreground" />}
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
      <Link
        href="/socials"
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-[#8A715C]"
      >
        Connect an account <ArrowUpRight className="size-3" />
      </Link>
    </div>
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
