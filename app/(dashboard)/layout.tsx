import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentPlan } from '@/lib/plan/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, plan] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    getCurrentPlan(),
  ])

  const planLabel = `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`

  return (
    <DashboardShell
      businessName={profile?.full_name ?? 'My Business'}
      planLabel={planLabel}
    >
      {children}
    </DashboardShell>
  )
}
