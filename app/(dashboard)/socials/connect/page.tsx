'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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
    description: 'Connect your Snapchat account so its analytics light up as the integration goes live.',
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
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div>
        <Link href="/socials" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Socials
        </Link>
        <h1 className="mt-2 font-baloo text-3xl font-extrabold text-primary">Connect Your Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Link your social profiles to schedule and publish posts from Tala.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((platform) => {
          const connected = getConnectedAccount(platform.id)
          return (
            <Card key={platform.id}>
              <CardHeader>
                <span
                  className="flex size-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.label[0]}
                </span>
                <CardTitle>{platform.label}</CardTitle>
                <CardDescription>{platform.description}</CardDescription>
                {connected && (
                  <p className="flex items-center gap-1.5 text-xs text-green-600 font-medium pt-1">
                    <CheckCircle2 className="size-3.5" />
                    Connected as {connected.username}
                  </p>
                )}
              </CardHeader>
              <CardFooter>
                <Button
                  variant={connected ? 'secondary' : 'outline'}
                  className="w-full"
                  disabled={platform.comingSoon}
                  onClick={() => handleConnect(platform.id)}
                >
                  {platform.comingSoon ? 'Coming soon' : connected ? 'Reconnect' : 'Connect'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      </div>
    </div>
  )
}
