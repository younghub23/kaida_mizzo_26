'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logError } from '@/lib/log'

type Mode = 'login' | 'signup'
type AccountType = 'business' | 'creator'

interface Props {
  initialMode?: Mode
}

const ACCENT = '#C13A77'
const BG = '#FBF0CE'

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: `1.2px solid ${ACCENT}`,
    borderRadius: 0,
    padding: '13px 2px',
    outline: 'none',
    fontFamily: 'var(--font-fredoka)',
    fontWeight: 400,
    fontSize: '15px',
    letterSpacing: '0.04em',
    color: ACCENT,
  }

  return (
    <>
      <style>{`
        .tala-input::placeholder {
          color: #CC6E9B;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 13px;
          font-family: var(--font-fredoka);
        }
        .tala-input:focus {
          border-bottom-width: 2px;
          transition: border-bottom-width 0.15s;
        }
        .tala-submit:hover:not(:disabled) {
          background: ${ACCENT};
          color: ${BG};
        }
        .tala-toggle-link:hover {
          opacity: 0.75;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          background: BG,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Wordmark */}
          <span
            style={{
              fontFamily: 'var(--font-fredoka)',
              fontWeight: 700,
              fontSize: '72px',
              letterSpacing: '-0.03em',
              lineHeight: 0.9,
              color: ACCENT,
            }}
          >
            tala
          </span>

          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-fredoka)',
              fontWeight: 400,
              fontSize: '27px',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              color: ACCENT,
              margin: '46px 0 30px',
            }}
          >
            {mode === 'login' ? 'Sign in' : 'Sign up'}
          </h1>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '30px',
              width: '100%',
            }}
          >
            {/* Account type — signup only */}
            {mode === 'signup' && (
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-fredoka)',
                    fontSize: '13px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: ACCENT,
                    opacity: 0.85,
                    marginBottom: '12px',
                  }}
                >
                  Account type
                </p>
                <div style={{ display: 'flex', gap: '14px' }}>
                  {(['business', 'creator'] as AccountType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      style={{
                        flex: 1,
                        padding: '14px 10px',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-fredoka)',
                        fontSize: '13px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        border: `1.4px solid ${ACCENT}`,
                        background: accountType === type ? ACCENT : 'transparent',
                        color: accountType === type ? BG : ACCENT,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {type === 'business' ? 'Business' : 'Creator'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Business name — signup + business only */}
            {showBusinessName && (
              <input
                className="tala-input"
                type="text"
                placeholder="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={inputStyle}
              />
            )}

            {/* Email */}
            <input
              className="tala-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            {/* Password */}
            <input
              className="tala-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="tala-submit"
              style={{
                width: '100%',
                padding: '17px',
                background: 'transparent',
                border: `1.4px solid ${ACCENT}`,
                borderRadius: '2px',
                color: ACCENT,
                fontFamily: 'var(--font-fredoka)',
                fontWeight: 500,
                fontSize: '14px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginTop: '6px',
                transition: 'all 0.2s',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading
                ? '...'
                : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
            </button>
          </form>

          {/* Error / reset confirmation */}
          {error && (
            <p
              aria-live="polite"
              style={{
                fontFamily: 'var(--font-fredoka)',
                fontSize: '13px',
                color: ACCENT,
                opacity: 0.9,
                textAlign: 'center',
                marginTop: '16px',
              }}
            >
              {error}
            </p>
          )}
          {resetSent && !error && (
            <p
              style={{
                fontFamily: 'var(--font-fredoka)',
                fontSize: '13px',
                color: ACCENT,
                opacity: 0.9,
                textAlign: 'center',
                marginTop: '16px',
              }}
            >
              Password reset email sent — check your inbox.
            </p>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: '34px',
              fontFamily: 'var(--font-dm-serif)',
              fontStyle: 'italic',
              fontSize: '15.5px',
              lineHeight: 1.9,
              color: ACCENT,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {mode === 'login' && (
              <a
                href="#"
                onClick={handleForgotPassword}
                style={{
                  color: ACCENT,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Forgot your password?
              </a>
            )}
            <span>
              <span style={{ opacity: 0.85 }}>
                {mode === 'login'
                  ? "Don't have an account?"
                  : 'Already have an account?'}
              </span>{' '}
              <button
                type="button"
                className="tala-toggle-link"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError(null)
                  setResetSent(false)
                }}
                style={{
                  fontFamily: 'var(--font-dm-serif)',
                  fontStyle: 'italic',
                  fontSize: '15.5px',
                  color: ACCENT,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                {mode === 'login' ? 'Sign Up.' : 'Log In.'}
              </button>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
