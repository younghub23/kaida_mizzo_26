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

  // TEMP DIAGNOSTICS: record what Meta returns at each stage into a table we can
  // read, to pinpoint why connects save nothing. Never stores access tokens.
  // Remove this (and drop public.meta_connect_debug) once the issue is found.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const debug: Record<string, unknown> = {}
  const writeDebug = async (stage: string) => {
    try {
      await supabase.from('meta_connect_debug').insert({ user_id: user?.id ?? null, stage, detail: debug })
    } catch {
      // best-effort
    }
  }

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    )
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: unknown }
    debug.token_ok = !!tokenData.access_token
    debug.token_error = tokenData.error ?? null

    if (!tokenData.access_token) {
      logError('social/meta/callback', 'Failed to get access token', undefined, { tokenData })
      await writeDebug('token_failed')
      return NextResponse.redirect(new URL('/socials/connect?error=token', req.url))
    }

    // Exchange for long-lived token
    const longLivedRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longLivedData = (await longLivedRes.json()) as { access_token?: string; error?: unknown }
    debug.long_ok = !!longLivedData.access_token
    debug.long_error = longLivedData.error ?? null

    if (!longLivedData.access_token) {
      logError('social/meta/callback', 'Failed to get long-lived token', undefined, { longLivedData })
      await writeDebug('long_failed')
      return NextResponse.redirect(new URL('/socials/connect?error=long_token', req.url))
    }

    const longLivedToken = longLivedData.access_token

    // Get user's Facebook Pages
    const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${longLivedToken}`)
    const pagesData = (await pagesRes.json()) as {
      data?: Array<{ id: string; name: string; access_token: string }>
      error?: unknown
    }
    debug.pages_status = pagesRes.status
    debug.pages_count = pagesData.data?.length ?? 0
    debug.pages = pagesData.data?.map((p) => ({ id: p.id, name: p.name })) ?? null
    debug.pages_error = pagesData.error ?? null
    debug.has_user = !!user

    if (!user) {
      logError('social/meta/callback', 'User not authenticated')
      await writeDebug('no_user')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (!pagesData.data?.length) {
      logError('social/meta/callback', 'No Facebook pages found', undefined, { pagesData })
      await writeDebug('no_pages')
      return NextResponse.redirect(new URL('/socials/connect?error=no_pages', req.url))
    }

    // Connect the first Page, then its linked Instagram Business account.
    // Each step redirects with a specific status so the UI reports the real
    // outcome instead of a misleading "success".
    const page = pagesData.data[0]

    const { error: fbErr } = await supabase.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'facebook',
        username: page.name,
        platform_user_id: page.id,
        access_token: page.access_token,
      },
      { onConflict: 'user_id,platform' }
    )
    debug.fb_saved = !fbErr
    debug.fb_error = fbErr ?? null
    if (fbErr) {
      logError('social/meta/callback', 'Failed to save Facebook account', fbErr)
      await writeDebug('fb_save_failed')
      return NextResponse.redirect(new URL('/socials/connect?error=save_failed', req.url))
    }

    // Find the Instagram Business account linked to this Page.
    const igRes = await fetch(
      `${GRAPH}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    )
    const igData = (await igRes.json()) as {
      instagram_business_account?: { id: string }
      error?: unknown
    }
    debug.ig_found = !!igData.instagram_business_account?.id
    debug.ig_raw = igData

    if (!igData.instagram_business_account?.id) {
      // Facebook connected, but this Page has no linked Instagram Business account.
      logError('social/meta/callback', 'No Instagram business account linked to page', undefined, {
        page: page.id,
      })
      await writeDebug('no_instagram')
      return NextResponse.redirect(new URL('/socials/connect?error=no_instagram', req.url))
    }

    const igId = igData.instagram_business_account.id
    const igInfoRes = await fetch(`${GRAPH}/${igId}?fields=name,username&access_token=${page.access_token}`)
    const igInfo = (await igInfoRes.json()) as { name?: string; username?: string }
    const igName = igInfo.name ?? igInfo.username ?? page.name

    const { error: igErr } = await supabase.from('social_accounts').upsert(
      {
        user_id: user.id,
        platform: 'instagram',
        username: igName,
        platform_user_id: igId,
        access_token: page.access_token,
      },
      { onConflict: 'user_id,platform' }
    )
    debug.ig_saved = !igErr
    debug.ig_error = igErr ?? null
    if (igErr) {
      logError('social/meta/callback', 'Failed to save Instagram account', igErr)
      await writeDebug('ig_save_failed')
      return NextResponse.redirect(new URL('/socials/connect?error=save_failed', req.url))
    }

    await writeDebug('success')
    return NextResponse.redirect(new URL('/socials/connect?success=1', req.url))
  } catch (err) {
    logError('social/meta/callback', 'Unexpected error during OAuth callback', err)
    debug.exception = String(err)
    await writeDebug('exception')
    return NextResponse.redirect(new URL('/socials/connect?error=unexpected', req.url))
  }
}
