import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

const SCOPES = ['snapchat-marketing-api'].join(' ')

export async function GET() {
  const clientId = process.env.SNAPCHAT_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/snapchat/callback`

  if (!clientId) {
    logError('social/snapchat/connect', 'SNAPCHAT_CLIENT_ID is not set')
    return NextResponse.json({ error: 'Snapchat app not configured' }, { status: 500 })
  }

  const url = new URL('https://accounts.snapchat.com/login/oauth2/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
