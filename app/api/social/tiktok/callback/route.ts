import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    logError('social/tiktok/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/socials/connect?error=oauth_denied', req.url))
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/tiktok/callback`

  if (!clientKey || !clientSecret) {
    logError('social/tiktok/callback', 'TikTok credentials not set')
    return NextResponse.redirect(new URL('/socials/connect?error=config', req.url))
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    const tokenData = (await tokenRes.json()) as {
      data?: { access_token?: string; open_id?: string }
      error?: { code?: number; message?: string }
    }

    const accessToken = tokenData.data?.access_token
    const openId = tokenData.data?.open_id

    if (!accessToken || !openId) {
      logError('social/tiktok/callback', 'Failed to get TikTok access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    // Get user info
    const userRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const userData = (await userRes.json()) as {
      data?: { user?: { display_name?: string } }
      error?: { code?: number }
    }

    const displayName = userData.data?.user?.display_name ?? 'TikTok User'

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      logError('social/tiktok/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const admin = createAdminClient()
    const { error: dbErr } = await admin.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'tiktok',
        account_name: displayName,
        access_token: accessToken,
      },
      { onConflict: 'user_id,platform' }
    )

    if (dbErr) {
      logError('social/tiktok/callback', 'Failed to save TikTok account', dbErr)
    }

    return NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
  } catch (err) {
    logError('social/tiktok/callback', 'Unexpected error', err)
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
