import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    logError('social/snapchat/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/socials/connect?error=oauth_denied', req.url))
  }

  const clientId = process.env.SNAPCHAT_CLIENT_ID
  const clientSecret = process.env.SNAPCHAT_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/snapchat/callback`

  if (!clientId || !clientSecret) {
    logError('social/snapchat/callback', 'Snapchat credentials not set')
    return NextResponse.redirect(new URL('/socials/connect?error=config', req.url))
  }

  try {
    const tokenRes = await fetch('https://accounts.snapchat.com/login/oauth2/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    const tokenData = (await tokenRes.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }

    if (!tokenData.access_token) {
      logError('social/snapchat/callback', 'Failed to get access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    // Account identity (Marketing API).
    const meRes = await fetch('https://adsapi.snapchat.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const meData = (await meRes.json()) as { me?: { id?: string; display_name?: string } }
    const username = meData.me?.display_name ?? 'Snapchat Account'

    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) {
      logError('social/snapchat/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    const { error: dbErr } = await supabase.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'snapchat',
        username,
        platform_user_id: meData.me?.id ?? null,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: expiresAt,
      },
      { onConflict: 'user_id,platform' }
    )
    if (dbErr) {
      logError('social/snapchat/callback', 'Failed to save Snapchat account', dbErr)
      return NextResponse.redirect(new URL('/socials/connect?error=save_failed', req.url))
    }

    return NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
  } catch (err) {
    logError('social/snapchat/callback', 'Unexpected error', err)
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
