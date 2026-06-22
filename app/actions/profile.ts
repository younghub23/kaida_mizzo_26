'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'
import type { BrandFormData } from '@/lib/brand'

export type FormState = {
  error: string | null
  success: boolean
}

// ---------------------------------------------------------------------------
// Brand info — first-class columns + brand_profile JSONB questionnaire.
// ---------------------------------------------------------------------------
export async function updateBrandProfile(
  data: BrandFormData
): Promise<FormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', success: false }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.businessName,
      industry: data.industry,
      avatar_url: data.avatarUrl || null,
      brand_profile: data.brand,
    })
    .eq('id', user.id)

  if (error) {
    logError('profile/updateBrandProfile', 'Failed to update brand profile', error, {
      userId: user.id,
    })
    return { error: error.message, success: false }
  }

  revalidatePath('/profile/brand')
  revalidatePath('/profile')
  return { error: null, success: true }
}

// ---------------------------------------------------------------------------
// Change password — reauthenticate with the current password, then update.
// ---------------------------------------------------------------------------
export async function changePassword(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return { error: 'Unauthorized', success: false }
  }

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword) {
    return { error: 'All fields are required.', success: false }
  }
  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.', success: false }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.', success: false }
  }

  // Reauthenticate by signing in with the supplied current password.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (reauthError) {
    return { error: 'Current password is incorrect.', success: false }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    logError('profile/changePassword', 'Failed to update password', error, {
      userId: user.id,
    })
    return { error: error.message, success: false }
  }

  return { error: null, success: true }
}

// ---------------------------------------------------------------------------
// Sign out of all devices (global scope).
// ---------------------------------------------------------------------------
export async function signOutEverywhere() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
  redirect('/login')
}

// ---------------------------------------------------------------------------
// Disconnect a linked social account.
// ---------------------------------------------------------------------------
export async function disconnectAccount(platform: string): Promise<FormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', success: false }
  }

  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform)

  if (error) {
    logError('profile/disconnectAccount', 'Failed to disconnect account', error, {
      userId: user.id,
      platform,
    })
    return { error: error.message, success: false }
  }

  revalidatePath('/profile/linked')
  return { error: null, success: true }
}

// ---------------------------------------------------------------------------
// Permanently delete the account (auth user + cascading profile data).
// ---------------------------------------------------------------------------
export async function deleteAccount(): Promise<FormState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', success: false }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    logError('profile/deleteAccount', 'Failed to delete account', error, {
      userId: user.id,
    })
    return { error: error.message, success: false }
  }

  await supabase.auth.signOut()
  redirect('/signup')
}
