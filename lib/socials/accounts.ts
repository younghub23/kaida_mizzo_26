import { createClient } from '@/lib/supabase/server'
import { isPlatformId, type PlatformId } from '@/lib/socials/platforms'

export type ConnectedAccount = { platform: PlatformId; username: string }

/** Connected social accounts for the signed-in user (from `social_accounts`). */
export async function getConnectedAccounts(): Promise<ConnectedAccount[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('social_accounts')
    .select('platform, username')
    .eq('user_id', user.id)

  if (!data) return []

  return data
    .filter((a): a is { platform: string; username: string } => !!a.platform)
    .filter((a) => isPlatformId(a.platform))
    .map((a) => ({ platform: a.platform as PlatformId, username: a.username || '' }))
}
