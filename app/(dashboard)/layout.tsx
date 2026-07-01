import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PLAN_LABELS, PLAN_DISPLAY_LABELS, isPlanTier } from '@/lib/analytics/plan'
import { getAccountType } from '@/lib/account'
import { parseCreatorProfile } from '@/lib/creator'

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
    .select('full_name, industry, plan, creator_profile, account_type')
    .eq('id', user.id)
    .single()

  const accountType = getAccountType(user)

  // Keep the denormalized profiles.account_type (used by the marketplace
  // directory) in sync with the authoritative value in auth metadata. Writes
  // only when it drifts, so this is a no-op on the common path.
  if (profile && profile.account_type !== accountType) {
    await supabase.from('profiles').update({ account_type: accountType }).eq('id', user.id)
  }

  // Foot identity — name + sub-line. Business shows "{industry} · {Plan} plan";
  // for creators the brand industry reads oddly, so their sub-line degrades to
  // their marketplace handle (real, once entered) or their plan label instead.
  let displayName: string
  let subLine: string

  if (accountType === 'creator') {
    displayName = profile?.full_name?.trim() || 'Your profile'
    const creator = parseCreatorProfile(profile?.creator_profile)
    const handle = creator.handle.trim()
    const planLabel = profile?.plan ? PLAN_DISPLAY_LABELS[profile.plan] : undefined
    subLine = handle
      ? handle.startsWith('@')
        ? handle
        : `@${handle}`
      : planLabel
        ? `${planLabel} plan`
        : ''
  } else {
    displayName = profile?.full_name?.trim() || 'My Business'
    const subParts: string[] = []
    const industry = profile?.industry?.trim()
    if (industry) subParts.push(industry)
    if (isPlanTier(profile?.plan)) subParts.push(`${PLAN_LABELS[profile.plan]} plan`)
    subLine = subParts.join(' · ')
  }

  // Top-bar avatar initial — the real signed-in user (name, else email).
  const userInitial = initialOf(profile?.full_name || user.email)

  return (
    <DashboardShell
      businessName={displayName}
      businessSub={subLine}
      userInitial={userInitial}
      accountType={accountType}
    >
      {children}
    </DashboardShell>
  )
}
