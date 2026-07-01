import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

// Pinterest OAuth 2.0 (API v5). We stash a random `state` nonce in a short-lived
// httpOnly cookie and verify it in the callback to guard against CSRF, mirroring
// the X connect flow. Scopes are comma-separated per Pinterest's spec.
const SCOPES = ['user_accounts:read', 'pins:read', 'boards:read'].join(',')

function randomString(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len)
}

export async function GET() {
  const clientId = process.env.PINTEREST_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/pinterest/callback`

  if (!clientId) {
    logError('social/pinterest/connect', 'PINTEREST_APP_ID is not set')
    return NextResponse.json({ error: 'Pinterest app not configured' }, { status: 500 })
  }

  const state = randomString(24)

  const url = new URL('https://www.pinterest.com/oauth/')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('pinterest_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return res
}
