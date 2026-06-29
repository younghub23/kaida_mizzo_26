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
  const sourceCounts = contacts.reduce<Record<string, number>>((acc, c) => {
    if (c.source) acc[c.source] = (acc[c.source] ?? 0) + 1
    return acc
  }, {})
  const sources = Object.entries(sourceCounts).map(([name, count]) => ({ name, count }))
  const businessName = profileRes.data?.full_name || 'yourbrand'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 sm:px-8">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-fredoka text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl">
            Socials
          </h1>
          <p className="mt-2 font-dm-serif text-lg italic text-muted-foreground sm:text-xl">
            Pick a channel to create a post, or manage your email campaigns below.
          </p>
        </div>
        <Link href="/socials/connect" className="shrink-0">
          <Button variant="outline" size="lg" className="gap-2 rounded-full">
            <Link2 className="size-4" />
            Connect Accounts
          </Button>
        </Link>
      </div>

      <SocialsHub
        accounts={accounts}
        businessName={businessName}
        canSync={canSync}
        contactCount={contacts.length}
        sources={sources}
      />
    </div>
  )
}
