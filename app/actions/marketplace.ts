'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

// Toggle whether the signed-in user's profile is discoverable in the Content
// Marketplace directory (profiles.marketplace_visible). Returns the new state.
export async function setMarketplaceVisibility(
  visible: boolean
): Promise<{ visible: boolean; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { visible, error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ marketplace_visible: visible })
    .eq('id', user.id)

  if (error) {
    logError('marketplace/setVisibility', 'Failed to update visibility', error, {
      userId: user.id,
    })
    return { visible: !visible, error: error.message }
  }

  revalidatePath('/marketplace')
  return { visible, error: null }
}
