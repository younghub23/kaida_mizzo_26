import Link from 'next/link'
import { Database, TriangleAlert, PlugZap, Plug, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SectionInfo } from '@/components/analytics/section-info'

/**
 * Plain-language explanation for each analytics section, keyed by the section's
 * title. Section looks this up automatically so every subsection gets a
 * consistent info affordance without wiring copy through each component. (Pass
 * an explicit `info` prop to override, e.g. for a sub-card like the trend graph.)
 */
export const SECTION_EXPLANATIONS: Record<string, string> = {
  'Core performance':
    "Your headline KPIs — engagement rate, followers, reach, impressions and clicks — totalled across every connected account. Each tile shows the current value and, where we have history, how it moved versus the previous period. It's the fastest read on whether your presence is growing, without opening each network.",
  'Top content':
    'Your best-performing posts across all connected networks, ranked by engagement. Use it to spot which formats and topics resonate so you can make more of what already works.',
  'Content performance':
    'A per-post breakdown of reach, engagement and engagement rate for your recent content. Comparing posts side by side shows what drives results beyond the top few, so you can refine your posting mix.',
  'Audience insights':
    "Who follows you — age, gender, location and when they're active — aggregated across networks. Knowing your real audience helps you tailor tone, topics and timing to the people actually watching.",
  'Cross-channel followers':
    'People who appear to follow you on more than one network, matched across platforms. It surfaces your most loyal, multi-platform fans and the true size of your combined audience instead of double-counting them.',
  'Best time to post':
    "The days and hours your audience has historically been most engaged, learned from your own posting history. Scheduling into these windows gives each post its best shot at reach.",
  'Competitor benchmark':
    "How your key metrics stack up against comparable brands. A number only tells you whether you're ahead or behind once you see it next to the rest of the field — that context is the point.",
  'ROI & conversion attribution':
    'Connects social activity to real outcomes — traffic, conversions and revenue — using UTM links and analytics. It answers the bottom-line question: what is your social effort actually earning?',
  'Custom report builder':
    'Assemble the metrics and sections you care about into a shareable report and export it. Handy for recurring updates to clients or stakeholders, or for your own records.',
  'Social listening & sentiment':
    'Tracks mentions of your brand and the sentiment — positive, neutral or negative — behind them across social platforms. It surfaces what people are saying so you can join conversations, catch issues early and gauge how your brand is perceived.',
}

/**
 * Append an alpha channel to a 6-digit hex colour (e.g. `#D6498C` → `#D6498C1A`).
 * Lets the source pill share a section's theme colour at a soft tint without
 * pulling in a colour library.
 */
function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex
}

/**
 * Small, consistent "Source:" caption shown on every analytics widget so it is
 * always obvious where the data comes from. The pill is tinted to the section's
 * theme colour (text = colour, ~10% fill, ~40% border); the wording itself
 * still carries the real "(live)" / "(not connected)" suffix from the loader.
 */
export function DataSource({
  label,
  color = '#1E7B82',
  className,
}: {
  label: string
  /** Section theme colour — tints text, fill (~10%), and border (~40%). */
  color?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium',
        className
      )}
      style={{ background: withAlpha(color, '1A'), color, borderColor: withAlpha(color, '66') }}
    >
      <Database className="size-3 shrink-0" />
      Source: {label}
    </span>
  )
}

/**
 * Page-level banner.
 *  - Production (allowMock=false): real data only. Explains live sources or, if
 *    nothing is connected, prompts to connect an account.
 *  - Development (allowMock=true): clarifies the page is showing mock/demo data.
 */
export function DemoBanner({
  livePlatforms = [],
  allowMock,
}: {
  livePlatforms?: string[]
  allowMock: boolean
}) {
  const isLive = livePlatforms.length > 0

  if (!allowMock) {
    return (
      <div className="flex items-start gap-2.5 rounded-[14px] border border-border bg-card px-4 py-3 text-sm shadow-[0_1px_0_rgba(255,255,255,.6)_inset]">
        <PlugZap className="mt-0.5 size-4 shrink-0 text-primary" />
        {isLive ? (
          <p>
            Showing <span className="font-semibold text-foreground">live data</span> from{' '}
            {livePlatforms.join(', ')}. Sections without a connected source stay
            empty until you connect them.
          </p>
        ) : (
          <p>
            <span className="font-semibold text-foreground">No connected accounts yet.</span>{' '}
            Connect a social account to start seeing your analytics —{' '}
            <Link
              href="/socials/connect"
              className="font-semibold text-primary underline underline-offset-2 hover:text-foreground"
            >
              connect now
            </Link>
            .
          </p>
        )}
      </div>
    )
  }

  // Dev-only mock notice — kept distinct as a "notice", warmed to the email/lemon
  // category palette so it still reads on-brand next to the cream cards.
  return (
    <div
      className="flex items-start gap-2.5 rounded-[14px] border px-4 py-3 text-sm"
      style={{ background: '#FBF0D2', borderColor: 'rgba(244,201,109,.6)', color: '#9A6E16' }}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      {isLive ? (
        <p>
          <span className="font-semibold">Partially live (dev)</span> — pulling
          real data from {livePlatforms.join(', ')}; other sections show{' '}
          <span className="font-medium">(mock)</span> placeholders.
        </p>
      ) : (
        <p>
          <span className="font-semibold">Demo data (dev)</span> — showing mock
          placeholders. On the live site only real data is shown. Each section
          notes its source.
        </p>
      )}
    </div>
  )
}

/**
 * Shown in place of a section's content when there's no connected data source.
 * Mirrors the dashboard's "ConnectEmpty": a dashed warm card, a Plug glyph in a
 * soft-sand chip, and an accent CTA that links to the connect flow.
 */
export function EmptyState({
  message = 'Not connected yet — connect an account to see this.',
}: {
  message?: string
}) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-[14px] border-[1.5px] border-dashed px-7 py-12 text-center"
      style={{ borderColor: 'rgba(164,141,120,.34)', background: 'rgba(234,227,214,.25)' }}
    >
      <span
        className="flex size-[54px] items-center justify-center rounded-full"
        style={{ background: '#EAE3D6', color: '#A48D78' }}
      >
        <Plug className="size-6" />
      </span>
      <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">{message}</p>
      <Button
        asChild
        size="sm"
        className="border-0 text-white transition-[filter] hover:brightness-105"
        style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
      >
        <Link href="/socials/connect" className="inline-flex items-center gap-1">
          Connect an account <ArrowUpRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  )
}

/** Section wrapper: title, optional description, a Source badge, and content. */
export function Section({
  title,
  description,
  source,
  icon: Icon,
  iconColor,
  eyebrow,
  action,
  info,
  children,
}: {
  title: string
  description?: string
  source: string
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  /** Category color from the palette — tints the icon and micro-label eyebrow. */
  iconColor?: string
  /** Short uppercase micro-label shown above the section title. */
  eyebrow?: string
  action?: React.ReactNode
  /**
   * Explanation shown behind the header "ⓘ" info button. Defaults to the
   * title-keyed copy in SECTION_EXPLANATIONS; pass `null` to hide the icon.
   */
  info?: React.ReactNode
  children: React.ReactNode
}) {
  const explanation = info === undefined ? SECTION_EXPLANATIONS[title] : info
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {eyebrow && (
            <span
              className="font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: iconColor ?? 'var(--primary)' }}
            >
              {eyebrow}
            </span>
          )}
          <div className="flex flex-wrap items-center gap-2.5">
            {Icon && <Icon className="size-4" style={{ color: iconColor ?? 'var(--primary)' }} />}
            <h2 className="font-fredoka text-lg font-semibold leading-none tracking-[-0.01em] text-foreground">
              {title}
            </h2>
            {explanation != null && explanation !== false && (
              <SectionInfo title={title} color={iconColor}>
                {explanation}
              </SectionInfo>
            )}
            <DataSource label={source} color={iconColor} />
          </div>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
