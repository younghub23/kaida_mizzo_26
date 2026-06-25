import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChannelComposer } from '@/components/socials/channel-composer'
import { PLATFORMS } from '@/lib/socials/platforms'
import { getDisplayName } from '@/lib/socials/accounts'

export default async function LinkedInPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username = await getDisplayName('linkedin')
  return <ChannelComposer platform={PLATFORMS.linkedin} username={username} />
}
