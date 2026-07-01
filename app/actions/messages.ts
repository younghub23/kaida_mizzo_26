'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateConversation } from '@/lib/messages'
import { getMarketplaceProfile } from '@/lib/marketplace'

// Start (or reopen) a DM with a marketplace profile, then land in the thread.
// Bound with the target id from the marketplace detail page's "Message" form.
export async function startConversation(otherId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Can't message yourself; only message a real, discoverable profile.
  if (user.id === otherId) redirect(`/marketplace/${otherId}`)
  const target = await getMarketplaceProfile(otherId)
  if (!target) redirect('/marketplace')

  const conversationId = await getOrCreateConversation(user.id, otherId)
  if (!conversationId) redirect(`/marketplace/${otherId}`)

  redirect(`/messages/${conversationId}`)
}
