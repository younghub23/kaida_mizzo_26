import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    logError('social/linkedin/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/social/connect?error=oauth_denied', req.url))
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/linkedin/callback`

  if (!clientId || !clientSecret) {
    logError('social/linkedin/callback', 'LinkedIn credentials not set')
    return NextResponse.redirect(new URL('/social/connect?error=config', req.url))
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }

    if (!tokenData.access_token) {
      logError('social/linkedin/callback', 'Failed to get access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/social/connect?error=token', req.url))
    }

    const accessToken = tokenData.access_token

    // Get user profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profile = (await profileRes.json()) as { sub?: string; name?: string; error?: string }

    if (!profile.sub) {
      logError('social/linkedin/callback', 'Failed to get LinkedIn profile', undefined, { profile })
      return NextResponse.redirect(new URL('/social/connect?error=profile', req.url))
    }

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      logError('social/linkedin/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const admin = createAdminClient()
    const { error: dbErr } = await admin.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'linkedin',
        account_name: profile.name ?? 'LinkedIn User',
        access_token: accessToken,
      },
      { onConflict: 'user_id,platform' }
    )

    if (dbErr) {
      logError('social/linkedin/callback', 'Failed to save LinkedIn account', dbErr)
    }

    return NextResponse.redirect(new URL('/social/connect?success=1', req.url))
  } catch (err) {
    logError('social/linkedin/callback', 'Unexpected error', err)
    return NextResponse.redirect(new URL('/social/connect?error=unexpected', req.url))
  }
}
