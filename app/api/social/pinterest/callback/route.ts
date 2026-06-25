import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    logError('social/pinterest/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/socials/connect?error=oauth_denied', req.url))
  }

  const clientId = process.env.PINTEREST_APP_ID
  const clientSecret = process.env.PINTEREST_APP_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/pinterest/callback`

  if (!clientId || !clientSecret) {
    logError('social/pinterest/callback', 'Pinterest credentials not set')
    return NextResponse.redirect(new URL('/socials/connect?error=config', req.url))
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })
    const tokenData = (await tokenRes.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }

    if (!tokenData.access_token) {
      logError('social/pinterest/callback', 'Failed to get access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    // Account identity.
    const acctRes = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const acct = (await acctRes.json()) as { username?: string }
    const username = acct.username ?? 'Pinterest Account'

    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user) {
      logError('social/pinterest/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    const { error: dbErr } = await supabase.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'pinterest',
        username,
        platform_user_id: username,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: expiresAt,
      },
      { onConflict: 'user_id,platform' }
    )
    if (dbErr) {
      logError('social/pinterest/callback', 'Failed to save Pinterest account', dbErr)
      return NextResponse.redirect(new URL('/socials/connect?error=save_failed', req.url))
    }

    return NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
  } catch (err) {
    logError('social/pinterest/callback', 'Unexpected error', err)
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
