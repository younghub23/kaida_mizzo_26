'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { disconnectAccount } from '@/app/actions/profile'

export type ConnectedAccount = { platform: string; username: string | null }

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  google: 'Google',
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  pinterest: '#E60023',
  google: '#4285F4',
}

const ALL_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'pinterest', 'google']

export function LinkedAccounts({
  connected,
}: {
  connected: ConnectedAccount[]
}) {
  const router = useRouter()
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleDisconnect(platform: string) {
    setPendingPlatform(platform)
    startTransition(async () => {
      const result = await disconnectAccount(platform)
      if (result.success) {
        toast.success(`${PLATFORM_LABELS[platform] ?? platform} disconnected`)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to disconnect')
      }
      setPendingPlatform(null)
    })
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {ALL_PLATFORMS.map((platform) => {
        const account = connected.find((a) => a.platform === platform)
        const label = PLATFORM_LABELS[platform] ?? platform
        return (
          <div key={platform} className="flex items-center gap-4 py-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-[11px] text-sm font-bold text-white"
              style={{ backgroundColor: PLATFORM_COLORS[platform] }}
            >
              {label[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{label}</p>
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
                <Badge variant="secondary">Connected</Badge>
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
              <Button asChild variant="outline" size="sm" className="gap-1.5">
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
