'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Link2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PLATFORMS, type PlatformId } from '@/lib/socials/platforms'
import { BrandLogo } from '@/components/socials/brand-logo'
import { ChannelComposer } from '@/components/socials/channel-composer'
import { EmailsSection } from '@/components/socials/emails-section'
import type { ConnectedAccount } from '@/lib/socials/accounts'

export function SocialsHub({
  accounts,
  businessName,
  canSync,
  contactCount,
  sources,
}: {
  accounts: ConnectedAccount[]
  businessName: string
  canSync: boolean
  contactCount: number
  sources: string[]
}) {
  const [selected, setSelected] = useState<PlatformId | null>(null)

  // Google connects for Analytics only, not posting — keep it off the hub.
  const postableAccounts = accounts.filter((a) => PLATFORMS[a.platform].postable)

  const usernameFor = (id: PlatformId) =>
    accounts.find((a) => a.platform === id)?.username || businessName

  return (
    <div className="flex flex-col gap-8">
      {/* channels */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Your channels
          </h2>
          <span className="text-sm text-muted-foreground">Tap a channel to compose</span>
        </div>

        {postableAccounts.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card p-8">
            <p className="text-sm text-muted-foreground">
              You haven’t connected any social accounts yet. Connect one to start posting.
            </p>
            <Link href="/socials/connect">
              <Button className="gap-2">
                <Link2 className="size-4" />
                Connect Accounts
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
                    'group relative flex flex-col items-center gap-2.5 rounded-2xl border bg-card p-4 text-center shadow-sm transition-all',
                    isActive
                      ? 'border-transparent ring-2 ring-[#D6488C]'
                      : 'border-border hover:-translate-y-0.5 hover:shadow-md'
                  )}
                >
                  {isActive && (
                    <span className="tala-grad absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full text-white shadow-sm">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <span
                    className="flex size-16 items-center justify-center rounded-2xl p-4 text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{ background: meta.gradient }}
                  >
                    <BrandLogo id={account.platform} />
                  </span>
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span className="-mt-1.5 truncate text-xs text-muted-foreground">
                    {account.username ? `@${account.username}` : businessName}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* inline composer — full width, only for the selected channel */}
      {selected && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <ChannelComposer
            key={selected}
            platform={PLATFORMS[selected]}
            username={usernameFor(selected)}
            onClose={() => setSelected(null)}
          />
        </section>
      )}

      {/* emails — always present, sits below the composer when one is open */}
      <EmailsSection canSync={canSync} contactCount={contactCount} sources={sources} />
    </div>
  )
}
