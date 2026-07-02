import Link from 'next/link'
import {
  ArrowUpRight,
  Store,
  MessageSquare,
  Compass,
  Users,
  Heart,
  UserRound,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NewsletterSignup } from '@/components/dashboard/newsletter-signup'
import { parseCreatorProfile } from '@/lib/creator'
import { listConversations } from '@/lib/messages'
import { RecommendedRail } from '@/components/marketplace/recommended-rail'
import { microLabel, card, cardLink, chipPalettes } from '@/app/(dashboard)/profile/ui'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// The creator home. Rendered in place of the business dashboard when the
// signed-in account is a creator (see app/(dashboard)/dashboard/page.tsx).
// Everything here is either the creator's own real profile data or an honest
// empty / "coming soon" state — no fabricated marketplace matches or messages.
export default async function CreatorDashboard({ user }: { user: User }) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, creator_profile')
    .eq('id', user.id)
    .single()

  const conversations = (await listConversations(user.id)).slice(0, 3)

  const creator = parseCreatorProfile(profile?.creator_profile)
  const name = (profile?.full_name || 'there').trim().split(/\s+/)[0]
  const avatarUrl = profile?.avatar_url?.trim() || ''
  const bio = creator.bio.trim()
  const handle = creator.handle.trim()
  const displayHandle = handle ? (handle.startsWith('@') ? handle : `@${handle}`) : ''
  const profileReady = Boolean(avatarUrl || bio)

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-8 pb-16 pt-8 max-[820px]:px-[22px]">
        {/* ── Page header ── */}
        <div>
          <h1 className="font-fredoka text-[34px] font-semibold leading-[1.05] tracking-[-0.01em]">
            {getGreeting()}, {name}
          </h1>
          <p className="mt-1.5 font-dm-serif text-lg italic text-primary">
            Your creator home for the Content Marketplace.
          </p>
        </div>

        {/* ── Top row: marketplace profile preview + messages/activity ── */}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* Marketplace profile preview */}
          <div className={`${card} ${cardLink} flex flex-col gap-4 p-6`}>
            <div className="flex items-center justify-between">
              <span className={microLabel}>Your marketplace profile</span>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:text-[#8A715C]"
              >
                Edit profile <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            {profileReady ? (
              <div className="flex items-start gap-4">
                <span className="size-16 shrink-0 overflow-hidden rounded-full bg-accent ring-1 ring-foreground/10">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={profile?.full_name || 'Your avatar'}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <UserRound className="size-7 text-muted-foreground" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-fredoka text-lg font-semibold leading-tight">
                    {profile?.full_name?.trim() || 'Your name'}
                  </p>
                  {displayHandle && (
                    <p className="mt-0.5 text-[13px] font-medium text-primary">{displayHandle}</p>
                  )}
                  {bio ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{bio}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      Add a bio so brands know what you&rsquo;re about.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
                <UserRound className="size-6 text-muted-foreground" />
                <p className="max-w-xs text-sm text-muted-foreground">
                  This is how your profile appears to brands in the Content Marketplace.
                  Add a photo and bio to complete it.
                </p>
                <Link
                  href="/profile/creator"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-[#8A715C]"
                >
                  Complete your profile <ArrowUpRight className="size-3" />
                </Link>
              </div>
            )}

            <p className="mt-1 text-[11.5px] text-muted-foreground">
              A preview of how you show up when brands browse the marketplace.
            </p>
          </div>

          {/* Notifications & activity (messages preview) */}
          <div className={`${card} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-fredoka text-base font-semibold">Notifications &amp; activity</span>
              <Link
                href="/messages"
                className="font-fredoka text-[12.5px] font-medium text-primary hover:text-[#8A715C]"
              >
                View messages →
              </Link>
            </div>
            {conversations.length === 0 ? (
              <div className="px-5 py-10">
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
                  <MessageSquare className="size-6 text-muted-foreground" />
                  <p className="max-w-xs text-sm text-muted-foreground">
                    No messages yet — brands who reach out via the marketplace will appear here.
                  </p>
                </div>
              </div>
            ) : (
              conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-3 border-b border-border px-5 py-3.5 transition-colors last:border-b-0 hover:bg-accent/40"
                >
                  <span className="size-9 shrink-0 overflow-hidden rounded-full bg-accent ring-1 ring-foreground/10">
                    {c.other.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.other.avatarUrl} alt={c.other.name} className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center">
                        <UserRound className="size-4 text-muted-foreground" />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13.5px] ${c.unread > 0 ? 'font-bold' : 'font-semibold'}`}>
                      {c.other.name}
                    </p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {c.lastMessagePreview || 'No messages yet'}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span
                      className="flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white"
                      style={{ background: 'linear-gradient(120deg,#D6488C,#E08A3C)' }}
                    >
                      {c.unread}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* ── Explore row: marketplace discovery (coming soon) ── */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <span className={microLabel}>Explore</span>
              <p className="mt-1 font-fredoka text-base font-semibold">Discover brands to work with</p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-[11px] px-4 py-2.5 font-fredoka text-[13.5px] font-medium text-white shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105"
              style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
            >
              <Store className="size-4" />
              Open marketplace
            </Link>
          </div>
          <div className="px-5 py-5">
            <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
              Soon, Tala will suggest brands that aim for a similar demographic, marketing
              sector, and content values as you — so the right partnerships find you.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {EXPLORE_TILES.map((tile, i) => {
                const palette = chipPalettes[i % chipPalettes.length]
                const Icon = tile.icon
                return (
                  <div
                    key={tile.title}
                    className="flex flex-col gap-2 rounded-[14px] border p-4"
                    style={{ background: palette.bg, borderColor: palette.border }}
                  >
                    <span
                      className="flex size-9 items-center justify-center rounded-[10px] bg-white/70"
                      style={{ color: palette.text }}
                    >
                      <Icon className="size-[18px]" strokeWidth={1.8} />
                    </span>
                    <p className="font-fredoka text-sm font-semibold" style={{ color: palette.text }}>
                      {tile.title}
                    </p>
                    <p className="text-[12.5px] leading-snug text-foreground/70">{tile.body}</p>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Coming soon
            </p>
          </div>
        </div>

        {/* ── Recommended for you ── */}
        <RecommendedRail user={user} />

        {/* ── Footer ── */}
        <CreatorFooter />
      </div>
    </div>
  )
}

// What marketplace discovery will do — described honestly, no invented brands.
const EXPLORE_TILES = [
  {
    title: 'Similar demographics',
    body: 'Brands chasing the same audience you already reach.',
    icon: Users,
  },
  {
    title: 'Matching sectors',
    body: 'Companies in the content niches you create for.',
    icon: Compass,
  },
  {
    title: 'Shared values',
    body: 'Partners whose values line up with yours.',
    icon: Heart,
  },
]

// ── Footer ────────────────────────────────────────────────────────────────────
const NAVIGATE_LINKS = [
  { href: '/marketplace', label: 'Content Marketplace' },
  { href: '/messages', label: 'Messages' },
  { href: '/profile', label: 'Profile' },
  { href: '/about', label: 'Our story' },
]

const SOCIAL_LINKS = ['Instagram', 'YouTube', 'TikTok', 'X', 'Snapchat']

const SUPPORT_LINKS = [
  { href: '/about', label: 'Help center' },
  { href: '/about', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
]

function CreatorFooter() {
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
