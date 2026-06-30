'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PLATFORMS, type PlatformId } from '@/lib/socials/platforms'
import { BrandLogo } from '@/components/socials/brand-logo'
import { ChannelComposer } from '@/components/socials/channel-composer'
import { EmailsSection } from '@/components/socials/emails-section'
import type { ConnectedAccount } from '@/lib/socials/accounts'

const microLabel = 'font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary'

export function SocialsHub({
  accounts,
  businessName,
  canSync,
  contactCount,
  sources,
  sourceCounts,
}: {
  accounts: ConnectedAccount[]
  businessName: string
  canSync: boolean
  contactCount: number
  sources: string[]
  sourceCounts: Record<string, number>
}) {
  const [selected, setSelected] = useState<PlatformId | null>(null)

  // Google connects for Analytics only, not posting — keep it off the hub.
  const postableAccounts = accounts.filter((a) => PLATFORMS[a.platform].postable)

  const usernameFor = (id: PlatformId) =>
    accounts.find((a) => a.platform === id)?.username || businessName

  return (
    <div className="flex flex-col">
      {/* ── Your channels ── */}
      <section className="mb-[34px] flex flex-col">
        <div className="mb-4 flex items-baseline gap-3">
          <span className={microLabel}>Your channels</span>
          <span className="text-[12.5px] text-muted-foreground">Tap a channel to compose</span>
        </div>

        {postableAccounts.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[rgba(164,141,120,0.34)] bg-[rgba(234,227,214,0.35)] px-7 py-[38px] text-center">
            <span className="mb-1.5 flex size-12 items-center justify-center rounded-[13px] bg-accent">
              <Link2 className="size-6 text-primary" strokeWidth={1.7} />
            </span>
            <h3 className="font-fredoka text-base font-semibold">
              You haven&rsquo;t connected any accounts yet
            </h3>
            <p className="mb-2 max-w-[320px] text-[13px] text-muted-foreground">
              Connect Instagram, Facebook, LinkedIn and more to start scheduling posts from one
              place.
            </p>
            <Button asChild className="h-9 gap-2 px-4 font-fredoka">
              <Link href="/socials/connect">
                <Link2 className="size-4" />
                Connect an account
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-[14px] sm:grid-cols-[repeat(auto-fill,minmax(116px,1fr))]">
            {postableAccounts.map((account) => {
              const meta = PLATFORMS[account.platform]
              const isActive = selected === account.platform
              return (
                <button
                  key={account.platform}
                  type="button"
                  onClick={() =>
                    setSelected((cur) => (cur === account.platform ? null : account.platform))
                  }
                  aria-pressed={isActive}
                  className={cn(
                    'group relative flex flex-col items-center gap-2.5 rounded-[14px] border border-border bg-card px-3 pb-3.5 pt-4 text-center shadow-[0_1px_0_rgba(255,255,255,.6)_inset] transition-[transform,box-shadow,border-color] duration-200',
                    isActive
                      ? 'border-transparent'
                      : 'hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]'
                  )}
                  style={
                    isActive
                      ? {
                          boxShadow: `0 0 0 2.5px ${meta.ring}, 0 6px 22px rgba(58,46,34,.12)`,
                        }
                      : undefined
                  }
                >
                  {isActive && (
                    <span
                      className="absolute right-[9px] top-[9px] flex size-5 items-center justify-center rounded-full"
                      style={{ background: meta.ring }}
                    >
                      <Check className="size-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <span
                    className="flex size-20 items-center justify-center rounded-[18px] text-white shadow-[0_4px_14px_rgba(58,46,34,.16)]"
                    style={{ background: meta.gradient }}
                  >
                    <span className="size-10">
                      <BrandLogo id={account.platform} />
                    </span>
                  </span>
                  <span className="font-fredoka text-sm font-semibold leading-none">
                    {meta.label}
                  </span>
                  {account.username && (
                    <span className="-mt-1.5 max-w-full truncate text-[11.5px] text-muted-foreground">
                      @{account.username}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Inline composer — revealed for the selected channel ── */}
      {selected && (
        <div className="socials-reveal -mt-[12px] mb-[34px]">
          <ChannelComposer
            key={selected}
            platform={PLATFORMS[selected]}
            username={usernameFor(selected)}
            onClose={() => setSelected(null)}
          />
        </div>
      )}

      {/* ── Emails — always present, below the composer ── */}
      <EmailsSection
        canSync={canSync}
        contactCount={contactCount}
        sources={sources}
        sourceCounts={sourceCounts}
      />
    </div>
  )
}
