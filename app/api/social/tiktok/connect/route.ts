import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

// TikTok Login Kit (OAuth 2.0). TikTok requires a `state` nonce for CSRF and
// supports PKCE (recommended for web). We generate a code_verifier + challenge,
// stash the verifier and state in short-lived httpOnly cookies, and read them
// back in the callback.
//
// Scopes:
//  - user.info.basic  → display name + avatar (identity for the connected card)
//  - video.publish / video.upload → post videos from Tala (Content Posting API)
// To light up TikTok analytics later, also request `user.info.stats` and
// `video.list` here (they must be approved for the app first).
const SCOPES = ['user.info.basic', 'video.publish', 'video.upload'].join(',')

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
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/tiktok/callback`

  if (!clientKey) {
    logError('social/tiktok/connect', 'TIKTOK_CLIENT_KEY is not set')
    return NextResponse.json({ error: 'TikTok app not configured' }, { status: 500 })
  }

  const codeVerifier = randomString(64)
  const challenge = base64url(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  )
  const state = randomString(24)

  const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key', clientKey)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')

  const res = NextResponse.redirect(url.toString())
  const cookieOpts = { httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge: 600, path: '/' }
  res.cookies.set('tiktok_code_verifier', codeVerifier, cookieOpts)
  res.cookies.set('tiktok_oauth_state', state, cookieOpts)
  return res
}
