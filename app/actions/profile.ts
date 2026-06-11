// Run in Supabase SQL editor: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry text;

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileState = {
  error: string | null
  success: boolean
}

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', success: false }
  }

  const fullName = formData.get('fullName') as string
  const avatarUrl = formData.get('avatarUrl') as string | null
  const industry = formData.get('industry') as string

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      avatar_url: avatarUrl || null,
      industry,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath('/profile')

  return { error: null, success: true }
}
