import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

// Stores a Google (GA4) connection on social_accounts. Uses the real columns:
// access_token, refresh_token, token_expires_at, username, platform_user_id
// (left null here — the GA4 property is resolved lazily by the provider, or
// could be set via a property-picker later).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    logError('social/google/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/socials/connect?error=oauth_denied', req.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/google/callback`

  if (!clientId || !clientSecret) {
    logError('social/google/callback', 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set')
    return NextResponse.redirect(new URL('/socials/connect?error=config', req.url))
  }

  try {
    // Exchange the authorization code for tokens.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = (await tokenRes.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
      error?: string
    }

    if (!tokenData.access_token) {
      logError('social/google/callback', 'Failed to get access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    // Fetch the account email for a friendly display name.
    let username = 'Google Account'
    try {
      const userInfo = (await (
        await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
      ).json()) as { email?: string }
      if (userInfo.email) username = userInfo.email
    } catch {
      // Non-fatal — keep the default display name.
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      logError('social/google/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    const admin = createAdminClient()
    const { error: dbErr } = await admin.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'google',
        username,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: expiresAt,
      },
      { onConflict: 'user_id,platform' }
    )

    if (dbErr) {
      logError('social/google/callback', 'Failed to save Google account', dbErr)
      return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
    }

    return NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
  } catch (err) {
    logError('social/google/callback', 'Unexpected error during OAuth callback', err)
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
