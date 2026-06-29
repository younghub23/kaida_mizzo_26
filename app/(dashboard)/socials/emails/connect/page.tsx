import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPlan } from '@/lib/plan/server'
import { canUseWebsiteSync } from '@/lib/analytics/plan'
import { getIngestKey, getContacts } from '@/app/actions/email'
import { ConnectWizard } from '@/components/socials/connect-wizard'

export default async function ConnectWebsitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Server-side plan gate — Starter/Growth can't reach this page.
  const plan = await getCurrentPlan()
  if (!canUseWebsiteSync(plan)) redirect('/plan')

  const [token, contacts] = await Promise.all([getIngestKey(), getContacts()])

  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const endpoint = `${proto}://${host}/api/public/contacts`

  const syncedCount = contacts.filter((c) => c.source !== 'manual').length

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <ConnectWizard initialToken={token} endpoint={endpoint} syncedCount={syncedCount} />
    </div>
  )
}
