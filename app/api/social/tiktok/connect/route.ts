import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

const SCOPES = ['user.info.basic', 'video.publish', 'video.upload'].join(',')

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/tiktok/callback`

  if (!clientKey) {
    logError('social/tiktok/connect', 'TIKTOK_CLIENT_KEY is not set')
    return NextResponse.json({ error: 'TikTok app not configured' }, { status: 500 })
  }

  const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key', clientKey)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
