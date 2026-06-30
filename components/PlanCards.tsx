'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { logError } from '@/lib/log'

interface Plan {
  name: string
  price: string
  priceId: string
  features: string[]
}

export default function PlanCards({
  plans,
  accountType,
}: {
  plans: Plan[]
  accountType: string
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      window.location.assign(url)
    } catch (err) {
      logError('plan', 'checkout redirect failed', err)
      setError('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  const busy = loading !== null

  return (
    <div className="tala-theme flex min-h-screen flex-col items-center justify-center bg-background px-8 pt-14 pb-16 text-foreground max-[560px]:px-5 max-[560px]:pt-9 max-[560px]:pb-12">
      <style>{`
        .plan-card:hover {
          box-shadow: 0 6px 22px rgba(58,46,34,.1);
          transform: translateY(-1px);
        }
        .plan-cta:not(:disabled):hover {
          filter: brightness(1.05);
          box-shadow: 0 5px 18px rgba(200,71,46,.32);
          transform: translateY(-1px);
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1280px]">
        {/* Header */}
        <header className="mb-11 text-center">
          <h1 className="font-fredoka text-[44px] font-bold leading-[1.05] tracking-[-0.01em] text-foreground">
            Tala Subscription
          </h1>
          <p className="mt-2 text-[19px] text-primary">{accountType}</p>
        </header>

        {/* Plans grid */}
        <div className="grid grid-cols-4 items-stretch gap-6 max-[1000px]:grid-cols-2 max-[560px]:grid-cols-1">
          {plans.map((plan, i) => {
            const isLoading = loading === plan.priceId
            return (
              <div
                key={plan.name}
                className={`plan-card flex flex-col rounded-[16px] border border-border bg-card shadow-[0_1px_0_rgba(255,255,255,.6)_inset] transition-[box-shadow,transform] duration-200${
                  selected === i && isLoading
                    ? ' outline outline-2 outline-offset-2 outline-primary/40'
                    : ''
                }`}
              >
                {/* Body */}
                <div className="flex flex-1 flex-col p-[28px_26px_22px]">
                  <div className="mb-1.5 flex items-center justify-between gap-2.5">
                    <span className="font-fredoka text-[23px] font-semibold text-foreground">
                      {plan.name}
                    </span>
                  </div>
                  <div className="mb-6 text-[18px] text-muted-foreground">
                    {plan.price}
                  </div>
                  <ul className="flex flex-col gap-[15px]">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-3 text-[16px] leading-[1.4] text-[#7a6a56]"
                      >
                        <Check
                          aria-hidden
                          strokeWidth={2.2}
                          className="mt-[3px] size-[17px] flex-none text-primary"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer CTA */}
                <div className="border-t border-border p-[20px_26px_26px]">
                  <button
                    onClick={() => handleSelect(plan.priceId, i)}
                    disabled={busy}
                    aria-busy={isLoading}
                    className="plan-cta flex w-full items-center justify-center rounded-[12px] px-[18px] py-[14px] font-fredoka text-[16px] font-medium text-white shadow-[0_2px_12px_rgba(200,71,46,.24)] transition-[filter,box-shadow,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      backgroundImage:
                        'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)',
                    }}
                  >
                    {isLoading ? '…' : 'Choose plan'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Error (real failures surfaced) */}
        {error && (
          <p
            aria-live="polite"
            className="mt-6 text-center text-[15px] text-destructive"
          >
            {error}
          </p>
        )}

        {/* Footer note */}
        <p className="mt-[26px] text-center text-[15px] text-muted-foreground">
          7-day free trial on new subscriptions. Cancel anytime from Manage
          subscription.
        </p>
      </div>
    </div>
  )
}
