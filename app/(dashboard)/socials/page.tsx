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

  // Real audience-source breakdown, aggregated from the loaded contacts. The
  // distinct list keeps the existing `string[]` shape (drives the audience
  // <select>); the counts feed the source chips. No fabricated numbers.
  const sourceCounts: Record<string, number> = {}
  for (const c of contacts) {
    if (c.source) sourceCounts[c.source] = (sourceCounts[c.source] ?? 0) + 1
  }
  const sources = Object.keys(sourceCounts)
  const businessName = profileRes.data?.full_name || 'yourbrand'

  return (
    <div className="tala-theme socials-page min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 sm:pb-[70px] sm:pt-[34px]">
        {/* ── Page header ── */}
        <div className="mb-[34px] flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-fredoka text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[40px]">
              Socials
            </h1>
            <p className="mt-2 font-dm-serif text-[19px] italic text-primary">
              Pick a channel to create a post, or manage your email campaigns below.
            </p>
          </div>
          <Button asChild variant="outline" className="h-9 gap-2 px-4 font-fredoka">
            <Link href="/socials/connect">
              <Link2 className="size-4" />
              Connect Accounts
            </Link>
          </Button>
        </div>

        <SocialsHub
          accounts={accounts}
          businessName={businessName}
          canSync={canSync}
          contactCount={contacts.length}
          sources={sources}
          sourceCounts={sourceCounts}
        />
      </div>
    </div>
  )
}
