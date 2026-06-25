import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getContacts } from '@/app/actions/email'
import { getCurrentPlan } from '@/lib/plan/server'
import { canUseWebsiteSync } from '@/lib/analytics/plan'
import { EmailListManager } from '@/components/socials/email-list-manager'

export default async function EmailListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [contacts, plan] = await Promise.all([getContacts(), getCurrentPlan()])
  return <EmailListManager initialContacts={contacts} canSync={canUseWebsiteSync(plan)} />
}
