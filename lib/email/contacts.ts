// ============================================================================
// Shared email-contact ingestion helper.
//
// Single chokepoint for adding contacts to a user's email list, used by:
//   - the public ingestion endpoint (/api/public/contacts)
//   - any internal server flow that should grow the list
//
// Uses the service-role client so it works without a session (server-to-server)
// and dedupes on (user_id, email).
// ============================================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

export type ContactSource = 'manual' | 'purchase' | 'signup' | 'newsletter' | 'website'

export type AddContactInput = {
  userId: string
  email: string
  name?: string
  source?: ContactSource
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/**
 * Upsert a single contact. Returns false on invalid email or DB error.
 * Existing contacts are left subscribed; only the name is refreshed.
 */
export async function addContact(input: AddContactInput): Promise<boolean> {
  const email = input.email.trim().toLowerCase()
  if (!isValidEmail(email)) return false

  const admin = createAdminClient()
  const { error } = await admin.from('contacts').upsert(
    {
      user_id: input.userId,
      email,
      name: input.name?.trim() ?? '',
      source: input.source ?? 'website',
      subscribed: true,
    },
    { onConflict: 'user_id,email', ignoreDuplicates: false }
  )

  if (error) {
    logError('email/contacts', 'Failed to upsert contact', error, { userId: input.userId })
    return false
  }
  return true
}
