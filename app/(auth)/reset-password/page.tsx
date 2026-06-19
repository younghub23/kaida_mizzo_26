'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logError } from '@/lib/log'

const ACCENT = '#C13A77'
const BG = '#FBF0CE'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      logError('auth', 'password reset failed', err)
      setError(err.message)
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
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
        .tala-input:focus { border-bottom-width: 2px; transition: border-bottom-width 0.15s; }
        .tala-submit:hover:not(:disabled) { background: ${ACCENT}; color: ${BG}; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', background: BG }}>
        <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: '72px', letterSpacing: '-0.03em', lineHeight: 0.9, color: ACCENT }}>
            tala
          </span>
          <h1 style={{ fontFamily: 'var(--font-fredoka)', fontWeight: 400, fontSize: '27px', letterSpacing: '0.01em', color: ACCENT, margin: '46px 0 30px' }}>
            New password
          </h1>

          {done ? (
            <p style={{ fontFamily: 'var(--font-fredoka)', fontSize: '15px', color: ACCENT, textAlign: 'center' }}>
              Password updated — redirecting…
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
              <input
                className="tala-input"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
              <input
                className="tala-input"
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={loading}
                className="tala-submit"
                style={{ width: '100%', padding: '17px', background: 'transparent', border: `1.4px solid ${ACCENT}`, borderRadius: '2px', color: ACCENT, fontFamily: 'var(--font-fredoka)', fontWeight: 500, fontSize: '14px', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: '6px', transition: 'all 0.2s', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? '...' : 'Update password'}
              </button>
              {error && (
                <p aria-live="polite" style={{ fontFamily: 'var(--font-fredoka)', fontSize: '13px', color: ACCENT, opacity: 0.9, textAlign: 'center', marginTop: '-10px' }}>
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  )
}
