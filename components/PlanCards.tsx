'use client'

import { useState } from 'react'
import { logError } from '@/lib/log'

const ACCENT = '#C13A77'
const BG = '#FBF0CE'
const R = 193
const G = 58
const B = 119

const GLOW_BLUR  = [3,    9,    15,   22  ]
const GLOW_ALPHA = [0.10, 0.22, 0.34, 0.48]

interface Plan {
  name: string
  price: string
  priceId: string
  features: string[]
}

export default function PlanCards({ plans }: { plans: Plan[] }) {
  const [selected, setSelected]   = useState<number | null>(null)
  const [loading,  setLoading]    = useState<string | null>(null)
  const [error,    setError]      = useState<string | null>(null)

  async function handleSelect(priceId: string, i: number) {
    setSelected(i)
    setLoading(priceId)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url, error: apiError } = await res.json()
      if (apiError || !url) {
        setError(apiError ?? 'Something went wrong. Please try again.')
        setLoading(null)
        return
      }
      window.location.href = url
    } catch (err) {
      logError('plan', 'checkout redirect failed', err)
      setError('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  return (
    <>
      <style>{`
        .plan-select-btn:hover:not(:disabled) {
          background: ${ACCENT};
          color: ${BG};
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '72px 40px 80px',
          background: BG,
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
            textAlign: 'center',
            color: ACCENT,
            margin: '30px 0 58px',
          }}
        >
          Tala Subscription Plan: Business
        </h1>

        {/* Cards row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '26px',
            alignItems: 'stretch',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '1140px',
          }}
        >
          {plans.map((plan, i) => {
            const isSel = selected === i
            const isLoading = loading === plan.priceId
            const otherLoading = loading !== null && !isLoading

            const glow = `0 0 ${GLOW_BLUR[i]}px 0 rgba(${R},${G},${B},${GLOW_ALPHA[i]})`
            const focusRing = `, 0 0 0 3px rgba(${R},${G},${B},0.14)`
            const boxShadow = isSel ? glow + focusRing : glow

            return (
              <div
                key={plan.name}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  maxWidth: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '36px 28px 30px',
                  borderRadius: '2px',
                  background: 'transparent',
                  border: `${isSel ? '1.6px' : '1.2px'} solid ${ACCENT}`,
                  boxShadow,
                  transition: 'box-shadow 0.25s, border-width 0.15s',
                }}
              >
                {/* Plan name */}
                <span
                  style={{
                    fontFamily: 'var(--font-fredoka)',
                    fontWeight: 700,
                    fontSize: '32px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    color: ACCENT,
                    marginBottom: '22px',
                  }}
                >
                  {plan.name}
                </span>

                {/* Price */}
                <span
                  style={{
                    fontFamily: 'var(--font-dm-serif)',
                    fontStyle: 'normal',
                    fontSize: '30px',
                    lineHeight: 1,
                    color: ACCENT,
                    marginBottom: '22px',
                  }}
                >
                  {plan.price}
                </span>

                {/* Features */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '11px',
                    alignSelf: 'stretch',
                    marginBottom: '30px',
                  }}
                >
                  {plan.features.map((feat) => (
                    <span
                      key={feat}
                      style={{
                        fontFamily: 'var(--font-dm-serif)',
                        fontStyle: 'italic',
                        fontSize: '15px',
                        lineHeight: 1.35,
                        color: ACCENT,
                        opacity: 0.9,
                      }}
                    >
                      {'— '}{feat}
                    </span>
                  ))}
                </div>

                {/* Select button */}
                <button
                  onClick={() => handleSelect(plan.priceId, i)}
                  disabled={loading !== null}
                  className="plan-select-btn"
                  style={{
                    marginTop: 'auto',
                    alignSelf: 'stretch',
                    padding: '13px',
                    borderRadius: '2px',
                    border: `1.3px solid ${ACCENT}`,
                    background: isSel ? ACCENT : 'transparent',
                    color: isSel ? BG : ACCENT,
                    fontFamily: 'var(--font-fredoka)',
                    fontWeight: 500,
                    fontSize: '13px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    cursor: loading !== null ? 'not-allowed' : 'pointer',
                    opacity: otherLoading ? 0.45 : 1,
                    pointerEvents: otherLoading ? 'none' : 'auto',
                  }}
                >
                  {isLoading ? '...' : isSel ? 'Selected' : 'Select'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Error */}
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
    </>
  )
}
