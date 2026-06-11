import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, industry')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <ProfileForm
        fullName={profile?.full_name ?? ''}
        avatarUrl={profile?.avatar_url ?? ''}
        industry={profile?.industry ?? ''}
      />
    </div>
  )
}
