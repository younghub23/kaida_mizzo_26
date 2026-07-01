import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

// Snapchat Marketing API OAuth 2.0. We stash a random `state` nonce in a
// short-lived httpOnly cookie and verify it in the callback to defend against
// CSRF. See https://developers.snap.com/api/marketing-api/Ads-API/authentication
const SCOPES = ['snapchat-marketing-api'].join(' ')

function randomString(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len)
}

export async function GET() {
  const clientId = process.env.SNAPCHAT_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/snapchat/callback`

  if (!clientId) {
    logError('social/snapchat/connect', 'SNAPCHAT_CLIENT_ID is not set')
    return NextResponse.json({ error: 'Snapchat app not configured' }, { status: 500 })
  }

  const state = randomString(24)

  const url = new URL('https://accounts.snapchat.com/login/oauth2/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('snapchat_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return res
}
