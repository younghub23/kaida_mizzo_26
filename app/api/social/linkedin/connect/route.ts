import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

// LinkedIn OAuth 2.0 (Authorization Code flow). LinkedIn is a confidential
// client, so we use the client secret in the callback rather than PKCE. We do
// pass a `state` nonce (stashed in a short-lived httpOnly cookie) and verify it
// in the callback to protect against CSRF — LinkedIn recommends this.
//
// Scopes:
//   openid, profile     — read the member's basic profile (via /v2/userinfo)
//   w_member_social     — post updates on the member's behalf
// `openid`/`profile` come from the "Sign In with LinkedIn using OpenID Connect"
// product; `w_member_social` comes from the "Share on LinkedIn" product. Both
// must be added to the LinkedIn app for this flow to work.
const SCOPES = ['openid', 'profile', 'w_member_social'].join(' ')

function randomString(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len)
}

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/linkedin/callback`

  if (!clientId) {
    logError('social/linkedin/connect', 'LINKEDIN_CLIENT_ID is not set')
    return NextResponse.json({ error: 'LinkedIn app not configured' }, { status: 500 })
  }

  const state = randomString(24)

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return res
}
