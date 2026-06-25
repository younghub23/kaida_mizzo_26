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
    <div className="flex flex-col gap-8 p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Socials</h1>
          <p className="text-sm text-muted-foreground">
            Pick a channel to create a post, or manage your email campaigns below.
          </p>
        </div>
        <Link href="/socials/connect">
          <Button variant="outline" className="gap-2">
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
