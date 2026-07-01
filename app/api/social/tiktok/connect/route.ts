import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

// TikTok Login Kit (OAuth 2.0). TikTok requires a `state` nonce for CSRF and
// supports PKCE (recommended for web). We generate a code_verifier + challenge,
// stash the verifier and state in short-lived httpOnly cookies, and read them
// back in the callback.
//
// Scopes:
//  - user.info.basic  → display name + avatar (identity for the connected card)
//  - user.info.stats  → follower/like/video counts (Analytics KPIs)
//  - video.publish / video.upload → post videos from Tala (Content Posting API)
//  - video.list       → per-video metrics for the Analytics posts table
// The stats/list scopes power lib/analytics/providers/tiktok.ts. All scopes
// must be approved for the app in the TikTok developer portal, or the login
// screen rejects the whole request.
const SCOPES = [
  'user.info.basic',
  'user.info.stats',
  'video.publish',
  'video.upload',
  'video.list',
].join(',')

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
