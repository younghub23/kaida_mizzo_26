import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const verifier = req.cookies.get('x_code_verifier')?.value
  const savedState = req.cookies.get('x_oauth_state')?.value

  if (error || !code) {
    logError('social/x/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/socials/connect?error=oauth_denied', req.url))
  }
  if (!verifier || !state || state !== savedState) {
    logError('social/x/callback', 'Missing/invalid PKCE state')
    return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
  }

  const clientId = process.env.X_CLIENT_ID
  const clientSecret = process.env.X_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/x/callback`

  if (!clientId || !clientSecret) {
    logError('social/x/callback', 'X credentials not set')
    return NextResponse.redirect(new URL('/socials/connect?error=config', req.url))
  }

  try {
    const basic = btoa(`${clientId}:${clientSecret}`)
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
        client_id: clientId,
      }),
    })
    const tokenData = (await tokenRes.json()) as {
      access_token?: string
      refresh_token?: string
      error?: string
    }

    if (!tokenData.access_token) {
      logError('social/x/callback', 'Failed to get access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    const meRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const me = (await meRes.json()) as { data?: { id?: string; username?: string } }

    if (!me.data?.id) {
      logError('social/x/callback', 'Failed to get X profile', undefined, { me })
      return NextResponse.redirect(new URL('/socials/connect?error=profile', req.url))
    }

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      logError('social/x/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { error: dbErr } = await supabase.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'x',
        username: me.data.username ?? 'X User',
        platform_user_id: me.data.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      },
      { onConflict: 'user_id,platform' }
    )

    if (dbErr) {
      logError('social/x/callback', 'Failed to save X account', dbErr)
      return NextResponse.redirect(new URL('/socials/connect?error=save_failed', req.url))
    }

    const res = NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
    res.cookies.delete('x_code_verifier')
    res.cookies.delete('x_oauth_state')
    return res
  } catch (err) {
    logError('social/x/callback', 'Unexpected error', err)
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
