import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseBrandProfile } from '@/lib/brand'
import { canUseAi } from '@/lib/analytics/plan'
import { BrandForm } from './brand-form'

export default async function BrandInfoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, industry, avatar_url, brand_profile, plan')
    .eq('id', user.id)
    .single()

  return (
    <BrandForm
      businessName={profile?.full_name ?? ''}
      industry={profile?.industry ?? ''}
      avatarUrl={profile?.avatar_url ?? ''}
      brand={parseBrandProfile(profile?.brand_profile)}
      aiEnabled={canUseAi(profile?.plan ?? 'free')}
    />
  )
}
