'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error: string | null
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const businessName = formData.get('businessName') as string
  // Account type mirrors the client AuthForm signup path so this server action
  // yields a correctly-typed account too. Anything other than 'creator' falls
  // through to the unchanged business signup.
  const accountType =
    formData.get('accountType') === 'creator' ? 'creator' : 'business'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: businessName,
        account_type: accountType,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // New signups pick a plan first (creators get their $10/mo card there).
  redirect('/plan')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
