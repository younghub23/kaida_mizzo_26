import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

// TEMP DIAGNOSTIC VERSION: on any failure this returns a plain-text page
// describing exactly what happened (no tokens shown), so we can see the cause
// in the browser. Will be reverted to clean redirects once the issue is found.
function note(msg: string) {
  return new NextResponse(`TALA GOOGLE CONNECT DEBUG\n\n${msg}`, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
      return note(`step=entry — Google returned no code.\nerror=${error ?? '(none)'}`)
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/google/callback`

    if (!clientId || !clientSecret) {
      return note(
        `step=config — missing env.\nhasClientId=${Boolean(clientId)} hasClientSecret=${Boolean(clientSecret)}\nredirectUri=${redirectUri}`
      )
    }

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
      error_description?: string
    }

    if (!tokenData.access_token) {
      return note(
        `step=token — token exchange failed.\nhttpStatus=${tokenRes.status}\ngoogleError=${tokenData.error ?? '(none)'}\ndescription=${tokenData.error_description ?? '(none)'}\nredirectUri=${redirectUri}`
      )
    }

    let username = 'Google Account'
    try {
      const userInfo = (await (
        await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
      ).json()) as { email?: string }
      if (userInfo.email) username = userInfo.email
    } catch {
      // Non-fatal.
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return note(
        `step=auth — could not read your Tala login session in the callback.\nhasUser=${Boolean(user)}\nauthError=${authErr?.message ?? '(none)'}\n\n(This means the session cookie isn't reaching the callback.)`
      )
    }

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    const { error: dbErr } = await supabase.from('social_accounts').upsert(
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
      return note(
        `step=db — saving the connection failed.\nuserId=${user.id}\ndbError=${dbErr.message}\ndbCode=${(dbErr as { code?: string }).code ?? '(none)'}`
      )
    }

    // Success — go back to the connect page as normal.
    return NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
  } catch (err) {
    logError('social/google/callback', 'Unexpected error during OAuth callback', err)
    return note(`step=exception — ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`)
  }
}
