'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/socials/brand-logo'
import { PLATFORMS, type PlatformId } from '@/lib/socials/platforms'
import { disconnectAccount } from '@/app/actions/profile'
import { card, chipPalettes } from '../ui'

export type ConnectedAccount = { platform: string; username: string | null }

// Platforms surfaced here all map to a brand glyph + gradient in PLATFORMS.
const ALL_PLATFORMS: PlatformId[] = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'google',
]

// Warm "connected" status pill — reuses the turquoise category palette.
const connectedPill = chipPalettes[2]

export function LinkedAccounts({
  connected,
}: {
  connected: ConnectedAccount[]
}) {
  const router = useRouter()
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleDisconnect(platform: PlatformId) {
    setPendingPlatform(platform)
    startTransition(async () => {
      const result = await disconnectAccount(platform)
      if (result.success) {
        toast.success(`${PLATFORMS[platform].label} disconnected`)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to disconnect')
      }
      setPendingPlatform(null)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {ALL_PLATFORMS.map((platform) => {
        const account = connected.find((a) => a.platform === platform)
        const meta = PLATFORMS[platform]
        return (
          <div key={platform} className={`flex items-center gap-4 ${card} p-4`}>
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-[12px] p-2.5 text-white"
              style={{ backgroundImage: meta.gradient }}
            >
              <BrandLogo id={platform} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-fredoka text-base font-semibold">{meta.label}</p>
              {account ? (
                <p className="truncate text-sm text-muted-foreground">
                  {account.username ?? 'Connected'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
            {account ? (
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background: connectedPill.bg,
                    borderColor: connectedPill.border,
                    color: connectedPill.text,
                  }}
                >
                  Connected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingPlatform === platform}
                  onClick={() => handleDisconnect(platform)}
                >
                  {pendingPlatform === platform ? 'Removing…' : 'Disconnect'}
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/socials/connect">
                  <Plus className="size-3.5" />
                  Connect
                </Link>
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
