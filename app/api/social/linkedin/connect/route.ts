import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

const SCOPES = ['openid', 'profile', 'w_member_social'].join(' ')

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/linkedin/callback`

  if (!clientId) {
    logError('social/linkedin/connect', 'LINKEDIN_CLIENT_ID is not set')
    return NextResponse.json({ error: 'LinkedIn app not configured' }, { status: 500 })
  }

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)

  return NextResponse.redirect(url.toString())
}
