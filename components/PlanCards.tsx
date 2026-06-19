'use client'

import { useState } from 'react'
import { logError } from '@/lib/log'

const ACCENT = '#C13A77'
const BG = '#FBF0CE'

const GLOW = [
  { shadow: 'rgba(193,58,119,0.07)', spread: '10px', bg: 'rgba(193,58,119,0.02)' },
  { shadow: 'rgba(193,58,119,0.14)', spread: '18px', bg: 'rgba(193,58,119,0.04)' },
  { shadow: 'rgba(193,58,119,0.26)', spread: '28px', bg: 'rgba(193,58,119,0.07)' },
  { shadow: 'rgba(193,58,119,0.40)', spread: '40px', bg: 'rgba(193,58,119,0.11)' },
]

interface Plan {
  name: string
  priceId: string
  bullets: string[]
}

export default function PlanCards({ plans }: { plans: Plan[] }) {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(priceId: string) {
    setError(null)
    setLoadingPriceId(priceId)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url, error: apiError } = await res.json()
      if (apiError || !url) {
        setError(apiError ?? 'Something went wrong. Please try again.')
        setLoadingPriceId(null)
        return
      }
      window.location.href = url
    } catch (err) {
      logError('plan', 'checkout redirect failed', err)
      setError('Something went wrong. Please try again.')
      setLoadingPriceId(null)
    }
  }

  return (
    <>
      <style>{`
        .plan-card-btn:hover:not(:disabled) { background: ${ACCENT}; color: ${BG}; }
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
            maxWidth: '1100px',
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
              color: ACCENT,
              margin: '46px 0 48px',
              textAlign: 'center',
            }}
          >
            Tala Subscription Plan: Business
          </h1>

          {/* Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              width: '100%',
            }}
          >
            {plans.map((plan, i) => {
              const glow = GLOW[i] ?? GLOW[GLOW.length - 1]
              return (
                <div
                  key={plan.name}
                  style={{
                    border: `1.4px solid ${ACCENT}`,
                    borderRadius: '2px',
                    padding: '36px 28px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    background: glow.bg,
                    boxShadow: `0 0 ${glow.spread} ${glow.shadow}`,
                  }}
                >
                  {/* Plan name */}
                  <span
                    style={{
                      fontFamily: 'var(--font-fredoka)',
                      fontWeight: 700,
                      fontSize: '32px',
                      letterSpacing: '-0.01em',
                      color: ACCENT,
                      marginBottom: '28px',
                    }}
                  >
                    {plan.name}
                  </span>

                  {/* Bullets */}
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 36px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      flex: 1,
                    }}
                  >
                    {plan.bullets.map((b, j) => (
                      <li
                        key={j}
                        style={{
                          fontFamily: 'var(--font-dm-serif)',
                          fontStyle: j === 0 ? 'normal' : 'italic',
                          fontSize: j === 0 ? '18px' : '14.5px',
                          color: ACCENT,
                          opacity: j === 0 ? 1 : 0.85,
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '8px',
                        }}
                      >
                        {j > 0 && (
                          <span style={{ fontSize: '10px', opacity: 0.65, flexShrink: 0 }}>
                            —
                          </span>
                        )}
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* Select button */}
                  <button
                    onClick={() => handleSelect(plan.priceId)}
                    disabled={loadingPriceId !== null}
                    className="plan-card-btn"
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'transparent',
                      border: `1.4px solid ${ACCENT}`,
                      borderRadius: '2px',
                      color: ACCENT,
                      fontFamily: 'var(--font-fredoka)',
                      fontWeight: 500,
                      fontSize: '13px',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                      cursor: loadingPriceId !== null ? 'not-allowed' : 'pointer',
                      opacity:
                        loadingPriceId !== null && loadingPriceId !== plan.priceId ? 0.45 : 1,
                    }}
                  >
                    {loadingPriceId === plan.priceId ? '...' : 'Select'}
                  </button>
                </div>
              )
            })}
          </div>

          {error && (
            <p
              aria-live="polite"
              style={{
                fontFamily: 'var(--font-fredoka)',
                fontSize: '13px',
                color: ACCENT,
                opacity: 0.9,
                textAlign: 'center',
                marginTop: '28px',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
