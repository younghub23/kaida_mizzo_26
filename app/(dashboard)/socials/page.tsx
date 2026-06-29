import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getConnectedAccounts } from '@/lib/socials/accounts'
import { getContacts } from '@/app/actions/email'
import { getCurrentPlan } from '@/lib/plan/server'
import { canUseWebsiteSync } from '@/lib/analytics/plan'
import { SocialsHub } from '@/components/socials/socials-hub'

export default async function SocialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [accounts, plan, contacts, profileRes] = await Promise.all([
    getConnectedAccounts(),
    getCurrentPlan(),
    getContacts(),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ])

  const canSync = canUseWebsiteSync(plan)
  const sources = Array.from(new Set(contacts.map((c) => c.source))).filter(Boolean)
  const businessName = profileRes.data?.full_name || 'yourbrand'

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
        {/* brand hero — cream→sand band echoing the Tala brand board */}
        <section className="relative overflow-hidden rounded-3xl border border-border tala-grad-soft px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          {/* soft terracotta sun in the corner */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full opacity-40 blur-2xl"
            style={{ background: 'radial-gradient(circle,#D98B5F,transparent 70%)' }}
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="font-poppins text-xs font-medium uppercase tracking-[0.22em] text-[#C4753F]">
                Tala · Socials
              </p>
              <h1 className="mt-1 font-baloo text-4xl font-extrabold leading-[1.05] text-[#C4753F] sm:text-5xl">
                Socials
              </h1>
              <p className="mt-2 font-poppins text-lg font-light italic text-foreground/80">
                marketing made simple
              </p>
              <p className="mt-3 font-poppins text-sm leading-relaxed text-foreground/75">
                Pick a channel to create a post, or manage your email campaigns below — all in one
                beachy, friendly place.
              </p>
            </div>
            <Link href="/socials/connect" className="shrink-0">
              <Button
                className="gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary"
              >
                <Link2 className="size-4" />
                Connect Accounts
              </Button>
            </Link>
          </div>
        </section>

        <SocialsHub
          accounts={accounts}
          businessName={businessName}
          canSync={canSync}
          contactCount={contacts.length}
          sources={sources}
        />
      </div>
    </div>
  )
}
