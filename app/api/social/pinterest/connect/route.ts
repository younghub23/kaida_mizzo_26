import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

const SCOPES = ['user_accounts:read', 'pins:read', 'boards:read'].join(',')

export async function GET() {
  const clientId = process.env.PINTEREST_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/pinterest/callback`

  if (!clientId) {
    logError('social/pinterest/connect', 'PINTEREST_APP_ID is not set')
    return NextResponse.json({ error: 'Pinterest app not configured' }, { status: 500 })
  }

  const url = new URL('https://www.pinterest.com/oauth/')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
