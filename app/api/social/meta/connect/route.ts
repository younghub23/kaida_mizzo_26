import { NextResponse } from 'next/server'
import { logError } from '@/lib/log'

const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
  // Analytics: required to read insights for the /analytics dashboard. These
  // need Meta App Review before they work in production, and accounts that
  // connected before this change must re-consent. See
  // app/(dashboard)/analytics/INTEGRATION.md.
  'read_insights',
  'instagram_manage_insights',
].join(',')

export async function GET() {
  const appId = process.env.META_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/meta/callback`

  if (!appId) {
    logError('social/meta/connect', 'META_APP_ID is not set')
    return NextResponse.json({ error: 'Meta app not configured' }, { status: 500 })
  }

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
