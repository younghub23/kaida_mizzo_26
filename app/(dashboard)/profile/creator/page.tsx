import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCreator } from '@/lib/account'
import { parseCreatorProfile } from '@/lib/creator'
import { CreatorForm } from './creator-form'

export default async function CreatorInfoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Profile Info is a creator-only page — send businesses back to their hub.
  if (!isCreator(user)) {
    redirect('/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, creator_profile')
    .eq('id', user.id)
    .single()

  return (
    <CreatorForm
      displayName={profile?.full_name ?? ''}
      avatarUrl={profile?.avatar_url ?? ''}
      creator={parseCreatorProfile(profile?.creator_profile)}
    />
  )
}
