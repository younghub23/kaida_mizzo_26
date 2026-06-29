import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

// X (Twitter) OAuth 2.0 requires PKCE. We generate a code_verifier + challenge,
// stash the verifier (and a state nonce) in short-lived httpOnly cookies, and
// read them back in the callback.

const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ')

function randomString(len: number): string {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, len)
}

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function GET() {
  const clientId = process.env.X_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/x/callback`

  if (!clientId) {
    logError('social/x/connect', 'X_CLIENT_ID is not set')
    return NextResponse.json({ error: 'X app not configured' }, { status: 500 })
  }

  const codeVerifier = randomString(64)
  const challenge = base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier)))
  const state = randomString(24)

  const url = new URL('https://twitter.com/i/oauth2/authorize')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')

  const res = NextResponse.redirect(url.toString())
  const cookieOpts = { httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge: 600, path: '/' }
  res.cookies.set('x_code_verifier', codeVerifier, cookieOpts)
  res.cookies.set('x_oauth_state', state, cookieOpts)
  return res
}
