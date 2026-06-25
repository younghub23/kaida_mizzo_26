import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChannelComposer } from '@/components/socials/channel-composer'
import { PLATFORMS, isPlatformId } from '@/lib/socials/platforms'
import { getDisplayName } from '@/lib/socials/accounts'

// Generic channel composer for non-dedicated platforms (Facebook, TikTok,
// Google). Dedicated platforms have their own static routes which take
// precedence over this dynamic segment.
export default async function GenericChannelPage({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await params
  if (!isPlatformId(platform)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username = await getDisplayName(platform)
  return <ChannelComposer platform={PLATFORMS[platform]} username={username} />
}
