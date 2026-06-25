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

/** A sensible display handle for previews: connected username, else business name. */
export async function getDisplayName(platform: PlatformId): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'yourbrand'

  const { data: account } = await supabase
    .from('social_accounts')
    .select('username')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .maybeSingle()

  if (account?.username) return account.username

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return profile?.full_name || 'yourbrand'
}
