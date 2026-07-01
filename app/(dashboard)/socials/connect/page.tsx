'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { card, cardLink } from '@/app/(dashboard)/profile/ui'

type SocialAccount = {
  platform: string
  username: string
}

type Platform = {
  id: string
  label: string
  color: string
  description: string
  comingSoon?: boolean
}

const PLATFORMS: Platform[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    description: 'Post updates, photos, and events directly to your Facebook Page.',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    description: 'Schedule feed posts and reels, and track engagement on your Instagram profile.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    description: 'Share company updates and articles with your professional network.',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#000000',
    description: 'Schedule and publish short-form videos to your TikTok business account.',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    description: 'Track subscribers, views, and video engagement on your YouTube channel.',
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    color: '#E60023',
    description: 'Track followers, monthly views, and pins on your Pinterest business account.',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    color: '#C9A800',
    description: 'Securely link your Snapchat Business account to Tala via the Snap Marketing API.',
  },
  {
    id: 'google',
    label: 'Google',
    color: '#4285F4',
    description: 'Connect Google Analytics 4 to track traffic, conversions, and revenue on your Analytics dashboard.',
  },
  {
    id: 'x',
    label: 'X',
    color: '#000000',
    description: 'Post and track engagement on X (formerly Twitter).',
  },
  {
    id: 'other',
    label: 'Other',
    color: '#6B7280',
    description: 'Threads, Reddit, Bluesky, and Google Business Profile — more platforms coming soon.',
    comingSoon: true,
  },
]

export default function ConnectAccountsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      toast.success('Account connected successfully!')
      router.replace('/socials/connect')
    } else if (error) {
      const messages: Record<string, string> = {
        oauth_denied: 'Connection was denied.',
        config: 'App not configured. Please contact support.',
        token: 'Failed to retrieve access token.',
        long_token: 'Failed to retrieve long-lived token.',
        no_pages:
          'No Facebook Page found. To connect Instagram you need a Facebook Page — and you must grant access to it during login.',
        no_instagram:
          'Facebook connected, but no Instagram Business account is linked to your Page. In Instagram, switch to a Business/Creator account and link it to your Facebook Page, then reconnect.',
        save_failed: 'Connected to Facebook, but saving the account failed. Please try again.',
        unexpected: 'An unexpected error occurred.',
      }
      toast.error(messages[error] ?? 'Connection failed.', { duration: 10000 })
      router.replace('/socials/connect')
    }
  }, [searchParams, router])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('social_accounts')
        .select('platform, username')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setAccounts(data)
        })
    })
  }, [])

  function getConnectedAccount(platformId: string) {
    return accounts.find((a) => a.platform === platformId)
  }

  function handleConnect(platformId: string) {
    const routes: Record<string, string> = {
      facebook: '/api/social/meta/connect',
      instagram: '/api/social/meta/connect',
      linkedin: '/api/social/linkedin/connect',
      tiktok: '/api/social/tiktok/connect',
      youtube: '/api/social/youtube/connect',
      pinterest: '/api/social/pinterest/connect',
      snapchat: '/api/social/snapchat/connect',
      google: '/api/social/google/connect',
      x: '/api/social/x/connect',
    }
    const route = routes[platformId]
    if (route) {
      window.location.assign(route)
    } else {
      toast('Coming soon')
    }
  }

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto w-full max-w-[1320px] px-7 pb-[72px] pt-[34px] sm:px-12 sm:pb-[90px] sm:pt-10">
        {/* ── Back link ── */}
        <Link
          href="/socials"
          className="mb-[26px] inline-flex items-center gap-[9px] font-fredoka text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-[18px]" />
          Back to Socials
        </Link>

        {/* ── Header ── */}
        <h1 className="font-fredoka text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[40px]">
          Connect Your Accounts
        </h1>
        <p className="mt-2.5 font-dm-serif text-[19px] italic text-primary">
          Link your social profiles to schedule and publish posts from Tala.
        </p>

        {/* ── Grid ── */}
        <div className="mt-[38px] grid grid-cols-1 items-stretch gap-[22px] min-[520px]:grid-cols-2 min-[880px]:grid-cols-3 min-[1180px]:grid-cols-4">
          {PLATFORMS.map((platform) => {
            const connected = getConnectedAccount(platform.id)
            return (
              <div
                key={platform.id}
                className={`${card} ${cardLink} flex h-full flex-col`}
              >
                {/* Body — flex:1 so the footer/button always aligns across cards */}
                <div className="flex flex-1 flex-col px-6 pb-5 pt-6">
                  <span
                    className="mb-4 flex size-[46px] flex-none items-center justify-center rounded-full font-fredoka text-[19px] font-semibold text-white shadow-[0_3px_10px_rgba(58,46,34,.18)]"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.label[0]}
                  </span>
                  <h2 className="mb-2 font-fredoka text-[20px] font-semibold text-foreground">
                    {platform.label}
                  </h2>
                  <p className="text-[15px] leading-[1.55] text-muted-foreground">
                    {platform.description}
                  </p>
                  {connected && (
                    <p className="mt-4 flex items-center gap-2 font-fredoka text-[13.5px] font-medium text-[#3E8E5A]">
                      <CheckCircle2 className="size-4 flex-none" />
                      Connected as {connected.username}
                    </p>
                  )}
                </div>

                {/* Footer — bottom-pinned button, identical on every card */}
                <div className="mt-auto border-t border-border px-6 pb-[22px] pt-4">
                  {platform.comingSoon ? (
                    <Button
                      variant="ghost"
                      disabled
                      className="h-auto w-full cursor-default rounded-[11px] border border-dashed border-input bg-transparent px-4 py-3 font-fredoka text-[15px] font-medium text-muted-foreground disabled:opacity-100"
                    >
                      Coming soon
                    </Button>
                  ) : connected ? (
                    <Button
                      variant="secondary"
                      onClick={() => handleConnect(platform.id)}
                      className="h-auto w-full rounded-[11px] border border-input bg-accent px-4 py-3 font-fredoka text-[15px] font-medium text-[#8A715C] hover:bg-[#E1D8C8] hover:text-foreground"
                    >
                      Reconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      className="h-auto w-full rounded-[11px] px-4 py-3 font-fredoka text-[15px] font-medium shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(200,71,46,.3)]"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
