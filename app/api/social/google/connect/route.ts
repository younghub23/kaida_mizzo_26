import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

// Google Analytics 4 (read-only) so the /analytics page can pull real web
// metrics (sessions, users, page views, conversions, revenue) via the GA4 Data
// API. `access_type=offline` + `prompt=consent` ensures we receive a
// refresh_token (GA4 access tokens expire in ~1h).
const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'openid',
  'email',
].join(' ')

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/google/callback`

  if (!clientId) {
    logError('social/google/connect', 'GOOGLE_CLIENT_ID is not set')
    return NextResponse.json({ error: 'Google app not configured' }, { status: 500 })
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('include_granted_scopes', 'true')

  return NextResponse.redirect(url.toString())
}
