import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PLAN_LABELS, isPlanTier } from '@/lib/analytics/plan'

// First letter of a name/email for the gradient avatar tiles. Falls back to a
// neutral dot so the avatar is never blank.
function initialOf(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '·'
}

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, industry, plan')
    .eq('id', user.id)
    .single()

  const businessName = profile?.full_name?.trim() || 'My Business'

  // Foot sub-line "{industry} · {Plan} plan" — built from real columns. Each
  // half is dropped when its source is missing so we never print a placeholder.
  const subParts: string[] = []
  const industry = profile?.industry?.trim()
  if (industry) subParts.push(industry)
  if (isPlanTier(profile?.plan)) subParts.push(`${PLAN_LABELS[profile.plan]} plan`)
  const businessSub = subParts.join(' · ')

  // Top-bar avatar initial — the real signed-in user (name, else email).
  const userInitial = initialOf(profile?.full_name || user.email)

  return (
    <DashboardShell
      businessName={businessName}
      businessSub={businessSub}
      userInitial={userInitial}
    >
      {children}
    </DashboardShell>
  )
}
