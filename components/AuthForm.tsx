'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logError } from '@/lib/log'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { microLabel } from '@/app/(dashboard)/profile/ui'

type Mode = 'login' | 'signup'
type AccountType = 'business' | 'creator'

interface Props {
  initialMode?: Mode
}

export default function AuthForm({ initialMode = 'login' }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [accountType, setAccountType] = useState<AccountType>('business')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  const showBusinessName = mode === 'signup' && accountType === 'business'

  function validate(): string | null {
    if (!email) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
    if (!password) return 'Password is required.'
    if (mode === 'signup' && password.length < 8) return 'Password must be at least 8 characters.'
    if (showBusinessName && !businessName) return 'Business name is required.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResetSent(false)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setLoading(true)
    const supabase = createClient()
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        logError('auth', 'sign in failed', err)
        setError(err.message)
        setLoading(false)
        return
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            account_type: accountType,
            ...(showBusinessName ? { business_name: businessName } : {}),
          },
        },
      })
      if (err) {
        logError('auth', 'sign up failed', err)
        setError(err.message)
        setLoading(false)
        return
      }
    }
    router.push(mode === 'signup' ? '/plan' : '/dashboard')
  }

  async function handleGoogle() {
    setError(null)
    setResetSent(false)
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (err) {
      logError('auth', 'google sign in failed', err)
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault()
    if (!email) {
      setError('Enter your email above, then click "Forgot your password?"')
      return
    }
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    })
    if (err) {
      logError('auth', 'password reset failed', err)
      setError(err.message)
    } else {
      setResetSent(true)
    }
  }

  const fieldInput =
    'h-auto rounded-[11px] bg-card px-[14px] py-3 text-[14.5px] md:text-[14.5px] ' +
    'focus-visible:ring-[3px] focus-visible:ring-ring/15'
  const fieldLabel = 'font-fredoka text-[12.5px] font-medium text-foreground'

  return (
    <div className="tala-theme flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 font-sans text-foreground">
      <div
        className={cn(
          'flex w-full max-w-[600px] flex-col items-center',
          'rounded-[18px] border border-border bg-card',
          'px-10 pt-[42px] pb-[34px]',
          'shadow-[0_1px_0_rgba(255,255,255,.6)_inset,0_12px_40px_rgba(58,46,34,.08)]',
          'max-[480px]:rounded-2xl max-[480px]:px-6 max-[480px]:pt-8 max-[480px]:pb-7'
        )}
      >
        {/* Logo */}
        <div className="mb-[30px] flex items-center gap-3">
          <div
            className="flex size-[38px] flex-none items-center justify-center rounded-[11px] font-fredoka text-[20px] font-bold text-white shadow-[0_2px_8px_rgba(214,72,140,.3)]"
            style={{ background: 'linear-gradient(135deg,#D6488C,#E08A3C)' }}
            aria-hidden="true"
          >
            t
          </div>
          <span className="font-fredoka text-[27px] font-semibold tracking-[-0.01em] text-foreground">
            Tala
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-1 self-start font-fredoka text-[26px] font-semibold text-foreground">
          {mode === 'login' ? 'Sign in' : 'Sign up'}
        </h1>
        <p className="mb-7 self-start font-dm-serif text-base italic text-primary">
          {mode === 'login'
            ? "Welcome back — let's get to work."
            : 'Start marketing like the big brands.'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[18px]">
          {/* Account type — signup only */}
          {mode === 'signup' && (
            <div className="flex flex-col gap-2">
              <span className={microLabel}>Account type</span>
              <div className="grid grid-cols-2 gap-[10px]">
                {(['business', 'creator'] as AccountType[]).map((type) => {
                  const active = accountType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      className={cn(
                        'rounded-[11px] border border-input p-[13px] font-fredoka text-sm font-medium transition-all',
                        active
                          ? 'border-primary bg-primary text-white shadow-[0_2px_8px_rgba(164,141,120,.3)]'
                          : 'bg-card text-foreground hover:bg-accent'
                      )}
                    >
                      {type === 'business' ? 'Business' : 'Creator'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Business name — signup + business only */}
          {showBusinessName && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="auth-business-name" className={fieldLabel}>
                Business name
              </Label>
              <Input
                id="auth-business-name"
                type="text"
                placeholder="Bloom & Co"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={fieldInput}
              />
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-email" className={fieldLabel}>
              Email
            </Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="you@bloomandco.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldInput}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-password" className={fieldLabel}>
              Password
            </Label>
            <Input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldInput}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="h-auto w-full rounded-[11px] py-[13px] font-fredoka text-[14.5px] font-medium"
          >
            {loading
              ? 'Signing in…'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </Button>

          {/* Divider */}
          <div className="my-1 flex items-center gap-[14px]">
            <span className="h-px flex-1 bg-border" />
            <span className={microLabel}>or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-[10px] rounded-[11px] border border-input bg-card py-[13px] font-fredoka text-[14.5px] font-medium text-foreground transition-all hover:border-primary hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <svg viewBox="0 0 48 48" className="size-[19px] flex-none" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Error / reset confirmation */}
        {error && (
          <p
            aria-live="polite"
            className="mt-4 text-center font-fredoka text-[13px] text-destructive"
          >
            {error}
          </p>
        )}
        {resetSent && !error && (
          <p className="mt-4 text-center font-fredoka text-[13px] text-primary">
            Password reset email sent — check your inbox.
          </p>
        )}

        {/* Footer */}
        <div className="mt-[26px] flex w-full flex-col items-center gap-3">
          {mode === 'login' && (
            <p className="text-center font-dm-serif text-[15.5px] italic text-muted-foreground">
              <a
                href="#"
                onClick={handleForgotPassword}
                className="text-primary underline underline-offset-2 hover:text-[#8a715c]"
              >
                Forgot your password?
              </a>
            </p>
          )}

          <p className="text-center font-dm-serif text-[15.5px] italic text-muted-foreground">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setResetSent(false)
              }}
              className="font-dm-serif text-[15.5px] italic text-primary underline underline-offset-2 hover:text-[#8a715c]"
            >
              {mode === 'login' ? 'Sign up.' : 'Log in.'}
            </button>
          </p>

          <div className="mt-2 flex w-full justify-center gap-[22px] border-t border-border pt-[18px]">
            <a
              href="/terms"
              className="font-fredoka text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground no-underline hover:text-foreground"
            >
              Terms
            </a>
            <a
              href="/privacy"
              className="font-fredoka text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground no-underline hover:text-foreground"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
