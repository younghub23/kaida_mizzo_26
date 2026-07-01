// ============================================================================
// Account type — creators vs. businesses.
//
// A user's account type is stored on their Supabase auth record
// (user_metadata.account_type), set at signup in components/AuthForm.tsx.
// Every creator/business branch in the app reads it through this one helper so
// the check is centralized rather than a scattered string comparison.
// ============================================================================

import type { User } from '@supabase/supabase-js'

export type AccountType = 'business' | 'creator'

// Resolve a user's account type. Anything other than the explicit 'creator'
// marker falls through to 'business' — the default, unchanged experience.
export function getAccountType(user: User | null | undefined): AccountType {
  return user?.user_metadata?.account_type === 'creator' ? 'creator' : 'business'
}

export function isCreator(user: User | null | undefined): boolean {
  return getAccountType(user) === 'creator'
}
