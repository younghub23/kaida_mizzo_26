'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
        {PLATFORMS.map((platform) => (
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
            </CardHeader>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toast('Coming soon')}
              >
                Connect
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
