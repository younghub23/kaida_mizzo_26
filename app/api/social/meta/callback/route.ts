/*
 * Migration SQL for social_accounts table:
 *
 * create table if not exists public.social_accounts (
 *   id          uuid primary key default gen_random_uuid(),
 *   user_id     uuid not null references auth.users(id) on delete cascade,
 *   platform    text not null check (platform in ('facebook', 'instagram')),
 *   account_name text not null,
 *   access_token text not null,
 *   created_at  timestamptz not null default now()
 * );
 *
 * alter table public.social_accounts enable row level security;
 *
 * create policy "Users manage own social accounts"
 *   on public.social_accounts
 *   for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

const GRAPH = 'https://graph.facebook.com/v19.0'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    logError('social/meta/callback', 'OAuth error or missing code', undefined, { error })
    return NextResponse.redirect(new URL('/socials/connect?error=oauth_denied', req.url))
  }

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/social/meta/callback`

  if (!appId || !appSecret) {
    logError('social/meta/callback', 'META_APP_ID or META_APP_SECRET is not set')
    return NextResponse.redirect(new URL('/socials/connect?error=config', req.url))
  }

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    )
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: unknown }

    if (!tokenData.access_token) {
      logError('social/meta/callback', 'Failed to get access token', undefined, { tokenData })
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    // Exchange for long-lived token
    const longLivedRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longLivedData = (await longLivedRes.json()) as { access_token?: string; error?: unknown }

    if (!longLivedData.access_token) {
      logError('social/meta/callback', 'Failed to get long-lived token', undefined, { longLivedData })
      return NextResponse.redirect(new URL('/socials/connect?error=long_token', req.url))
    }

    const longLivedToken = longLivedData.access_token

    // Get user's Facebook Pages
    const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${longLivedToken}`)
    const pagesData = (await pagesRes.json()) as {
      data?: Array<{ id: string; name: string; access_token: string }>
      error?: unknown
    }

    if (!pagesData.data?.length) {
      logError('social/meta/callback', 'No Facebook pages found', undefined, { pagesData })
      return NextResponse.redirect(new URL('/socials/connect?error=no_pages', req.url))
    }

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      logError('social/meta/callback', 'User not authenticated', authErr)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const admin = createAdminClient()

    for (const page of pagesData.data) {
      // Upsert Facebook page token
      const { error: fbErr } = await admin.from('social_accounts').upsert(
        {
          user_id: user.id,
          platform: 'facebook',
          username: page.name,
          platform_user_id: page.id,
          access_token: page.access_token,
        },
        { onConflict: 'user_id,platform' }
      )
      if (fbErr) {
        logError('social/meta/callback', 'Failed to save Facebook account', fbErr)
      }

      // Get Instagram account linked to this page
      const igRes = await fetch(
        `${GRAPH}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      )
      const igData = (await igRes.json()) as {
        instagram_business_account?: { id: string }
        error?: unknown
      }

      if (igData.instagram_business_account?.id) {
        const igId = igData.instagram_business_account.id
        const igInfoRes = await fetch(`${GRAPH}/${igId}?fields=name,username&access_token=${page.access_token}`)
        const igInfo = (await igInfoRes.json()) as { name?: string; username?: string }
        const igName = igInfo.name ?? igInfo.username ?? page.name

        const { error: igErr } = await admin.from('social_accounts').upsert(
          {
            user_id: user.id,
            platform: 'instagram',
            username: igName,
            platform_user_id: igId,
            access_token: page.access_token,
          },
          { onConflict: 'user_id,platform' }
        )
        if (igErr) {
          logError('social/meta/callback', 'Failed to save Instagram account', igErr)
        }
      }

      // Only handle the first page for now
      break
    }

    return NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
  } catch (err) {
    logError('social/meta/callback', 'Unexpected error during OAuth callback', err)
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
