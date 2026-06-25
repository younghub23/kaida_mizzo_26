import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    logError('social/youtube/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/socials/connect?error=oauth_denied', req.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/youtube/callback`

  if (!clientId || !clientSecret) {
    logError('social/youtube/callback', 'Google credentials not set')
    return NextResponse.redirect(new URL('/socials/connect?error=config', req.url))
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
      logError('social/youtube/callback', 'Failed to get access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    // Channel identity.
    const chRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const chData = (await chRes.json()) as { items?: { id?: string; snippet?: { title?: string } }[] }
    const channel = chData.items?.[0]
    const username = channel?.snippet?.title ?? 'YouTube Channel'

    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) {
      logError('social/youtube/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    const { error: dbErr } = await supabase.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'youtube',
        username,
        platform_user_id: channel?.id ?? null,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: expiresAt,
      },
      { onConflict: 'user_id,platform' }
    )
    if (dbErr) {
      logError('social/youtube/callback', 'Failed to save YouTube account', dbErr)
      return NextResponse.redirect(new URL('/socials/connect?error=save_failed', req.url))
    }

    return NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
  } catch (err) {
    logError('social/youtube/callback', 'Unexpected error', err)
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
