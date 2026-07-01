import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Store, ArrowLeft, Users, MessageSquare, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isCreator } from '@/lib/account'
import { microLabel, card, chipPalettes } from '@/app/(dashboard)/profile/ui'

// Placeholder for the Content Marketplace — a two-sided matchmaking space that
// connects Tala brands and creators: brands find creators to market their
// products, and creators find brands for deals. The real experience is built
// later; for now this is an honest, on-brand "coming soon" shell with no
// fabricated listings. Copy adapts to who's viewing.
export default async function MarketplacePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const creator = isCreator(user)

  // What this account will do here, framed for their side of the marketplace.
  const lead = creator
    ? 'Get discovered by brands and find the right ones for your next brand deal.'
    : 'Discover creators who fit your audience and reach out to market your products together.'

  const steps = creator
    ? [
        {
          icon: Users,
          title: 'Get matched',
          body: 'Surface for brands whose audience, sector, and values line up with yours.',
        },
        {
          icon: Sparkles,
          title: 'Find brand deals',
          body: 'Browse brands looking for creators like you and shortlist the best fits.',
        },
        {
          icon: MessageSquare,
          title: 'Start the conversation',
          body: 'Reach out and take it to Messages to plan the collaboration.',
        },
      ]
    : [
        {
          icon: Users,
          title: 'Get matched',
          body: 'See creators whose audience, niche, and values fit your brand.',
        },
        {
          icon: Sparkles,
          title: 'Find creators',
          body: 'Browse creators who can market your products and shortlist the best fits.',
        },
        {
          icon: MessageSquare,
          title: 'Start the conversation',
          body: 'Reach out and take it to Messages to plan the collaboration.',
        },
      ]

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8 max-[820px]:px-[22px]">
        <header>
          <span className={`${microLabel} mb-3.5 block`}>Discover</span>
          <h1 className="font-fredoka text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] max-[820px]:text-[32px]">
            Content{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(120deg,#D6488C,#E08A3C)' }}
            >
              Marketplace
            </span>
          </h1>
          <p className="mt-3 font-dm-serif text-[21px] italic text-muted-foreground">
            Where Tala brands and creators find each other.
          </p>
        </header>

        <div className={`${card} flex flex-col items-center gap-4 px-8 py-14 text-center`}>
          <span
            className="flex size-16 items-center justify-center rounded-[18px] text-white shadow-[0_3px_12px_rgba(200,71,46,.28)]"
            style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
          >
            <Store className="size-8" strokeWidth={1.8} />
          </span>
          <h2 className="font-fredoka text-2xl font-semibold">Coming soon</h2>
          <p className="max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
            The Content Marketplace matches Tala brands and creators for partnerships —
            think matchmaking for brand deals. {lead} Complete your profile now so
            you&rsquo;re ready when it opens.
          </p>

          {/* How it will work — three tinted steps. */}
          <div className="mt-4 grid w-full gap-4 text-left sm:grid-cols-3">
            {steps.map((step, i) => {
              const palette = chipPalettes[i % chipPalettes.length]
              const Icon = step.icon
              return (
                <div
                  key={step.title}
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
                    {step.title}
                  </p>
                  <p className="text-[12.5px] leading-snug text-foreground/70">{step.body}</p>
                </div>
              )
            })}
          </div>

          <Link
            href={creator ? '/profile/creator' : '/profile/brand'}
            className="mt-4 inline-flex items-center gap-2 rounded-[11px] px-5 py-[11px] text-[14.5px] font-medium text-white shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105"
            style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
          >
            {creator ? 'Complete your profile' : 'Complete your brand profile'}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#8A715C]"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
