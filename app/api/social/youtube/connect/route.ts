import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

// YouTube reuses Google OAuth with the read-only YouTube scope.
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'].join(' ')

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/youtube/callback`

  if (!clientId) {
    logError('social/youtube/connect', 'GOOGLE_CLIENT_ID is not set')
    return NextResponse.json({ error: 'YouTube app not configured' }, { status: 500 })
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(url.toString())
}
