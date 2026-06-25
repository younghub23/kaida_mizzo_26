'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Link2 } from 'lucide-react'
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

  const usernameFor = (id: PlatformId) =>
    accounts.find((a) => a.platform === id)?.username || businessName

  return (
    <div className="flex flex-col gap-8">
      {/* channels */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Your channels</h2>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-8">
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
          <div className="flex flex-wrap gap-5">
            {accounts.map((account) => {
              const meta = PLATFORMS[account.platform]
              const isActive = selected === account.platform
              return (
                <button
                  key={account.platform}
                  type="button"
                  onClick={() =>
                    setSelected((cur) => (cur === account.platform ? null : account.platform))
                  }
                  className="group flex w-28 flex-col items-center gap-2"
                  aria-pressed={isActive}
                >
                  <span
                    className={cn(
                      'flex size-20 items-center justify-center rounded-2xl p-5 text-white shadow-sm transition-transform group-hover:scale-105',
                      isActive && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                    )}
                    style={{ background: meta.gradient }}
                  >
                    <BrandLogo id={account.platform} />
                  </span>
                  <span className="text-sm font-medium">{meta.label}</span>
                  {account.username && (
                    <span className="-mt-1.5 truncate text-xs text-muted-foreground">
                      @{account.username}
                    </span>
                  )}
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
