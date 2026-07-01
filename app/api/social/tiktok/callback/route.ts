import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const verifier = req.cookies.get('tiktok_code_verifier')?.value
  const savedState = req.cookies.get('tiktok_oauth_state')?.value

  if (error || !code) {
    logError('social/tiktok/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/socials/connect?error=oauth_denied', req.url))
  }
  if (!verifier || !state || state !== savedState) {
    logError('social/tiktok/callback', 'Missing/invalid PKCE state')
    return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/tiktok/callback`

  if (!clientKey || !clientSecret) {
    logError('social/tiktok/callback', 'TikTok credentials not set')
    return NextResponse.redirect(new URL('/socials/connect?error=config', req.url))
  }

  try {
    // Exchange code for access token (PKCE — include the code_verifier).
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
    })
    // TikTok returns token fields at the top level of the JSON body.
    const tokenData = (await tokenRes.json()) as {
      access_token?: string
      refresh_token?: string
      open_id?: string
      expires_in?: number
      error?: string
      error_description?: string
    }

    const accessToken = tokenData.access_token
    const openId = tokenData.open_id

    if (!accessToken || !openId) {
      logError('social/tiktok/callback', 'Failed to get TikTok access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    // Access tokens expire in ~24h; store the expiry so a refresh can be
    // triggered before posting (refresh_token is stored alongside).
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    // Get user info (display name for the connected-account card).
    const userRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const userData = (await userRes.json()) as {
      data?: { user?: { display_name?: string } }
      error?: { code?: string }
    }

    const displayName = userData.data?.user?.display_name ?? 'TikTok User'

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      logError('social/tiktok/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { error: dbErr } = await supabase.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'tiktok',
        username: displayName,
        platform_user_id: openId,
        access_token: accessToken,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: expiresAt,
      },
      { onConflict: 'user_id,platform' }
    )

    if (dbErr) {
      logError('social/tiktok/callback', 'Failed to save TikTok account', dbErr)
      return NextResponse.redirect(new URL('/socials/connect?error=save_failed', req.url))
    }

    const res = NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
    res.cookies.delete('tiktok_code_verifier')
    res.cookies.delete('tiktok_oauth_state')
    return res
  } catch (err) {
    logError('social/tiktok/callback', 'Unexpected error', err)
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
