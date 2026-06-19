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
  account_name: string
}

const PLATFORMS = [
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
      router.replace('/social/connect')
    } else if (error) {
      const messages: Record<string, string> = {
        oauth_denied: 'Connection was denied.',
        config: 'App not configured. Please contact support.',
        token: 'Failed to retrieve access token.',
        long_token: 'Failed to retrieve long-lived token.',
        no_pages: 'No Facebook Pages found. Make sure you manage at least one Page.',
        unexpected: 'An unexpected error occurred.',
      }
      toast.error(messages[error] ?? 'Connection failed.')
      router.replace('/social/connect')
    }
  }, [searchParams, router])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('social_accounts')
        .select('platform, account_name')
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
    }
    const route = routes[platformId]
    if (route) {
      window.location.href = route
    } else {
      toast('Coming soon')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Link href="/social" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Social
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Connect Your Accounts</h1>
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
                    Connected as {connected.account_name}
                  </p>
                )}
              </CardHeader>
              <CardFooter>
                <Button
                  variant={connected ? 'secondary' : 'outline'}
                  className="w-full"
                  onClick={() => handleConnect(platform.id)}
                >
                  {connected ? 'Reconnect' : 'Connect'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
