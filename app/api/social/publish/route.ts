import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

const GRAPH = 'https://graph.facebook.com/v19.0'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { postId?: string }
  const { postId } = body

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: post, error: postErr } = await admin
    .from('scheduled_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (postErr || !post) {
    logError('social/publish', 'Failed to fetch post', postErr, { postId })
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const platforms: string[] = post.platforms ?? []
  const results: Record<string, 'published' | 'failed'> = {}

  for (const platform of ['facebook', 'instagram'] as const) {
    if (!platforms.includes(platform)) continue

    const { data: account, error: acctErr } = await admin
      .from('social_accounts')
      .select('access_token, account_name')
      .eq('user_id', post.user_id)
      .eq('platform', platform)
      .single()

    if (acctErr || !account) {
      logError('social/publish', `No ${platform} account found`, acctErr, { postId })
      results[platform] = 'failed'
      continue
    }

    try {
      if (platform === 'facebook') {
        // Get page ID first
        const meRes = await fetch(`${GRAPH}/me/accounts?access_token=${account.access_token}`)
        const meData = (await meRes.json()) as { data?: Array<{ id: string }> }
        const pageId = meData.data?.[0]?.id

        if (!pageId) {
          logError('social/publish', 'No Facebook page ID found', undefined, { postId })
          results[platform] = 'failed'
          continue
        }

        const feedRes = await fetch(`${GRAPH}/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: post.content,
            ...(post.image_url ? { link: post.image_url } : {}),
            access_token: account.access_token,
          }),
        })
        const feedData = (await feedRes.json()) as { id?: string; error?: unknown }

        if (!feedData.id) {
          logError('social/publish', 'Facebook publish failed', undefined, { feedData, postId })
          results[platform] = 'failed'
        } else {
          results[platform] = 'published'
        }
      } else if (platform === 'instagram') {
        // Get IG user ID
        const igMeRes = await fetch(`${GRAPH}/me?fields=id&access_token=${account.access_token}`)
        const igMe = (await igMeRes.json()) as { id?: string }

        if (!igMe.id) {
          logError('social/publish', 'No Instagram user ID', undefined, { postId })
          results[platform] = 'failed'
          continue
        }

        // Create media container
        const containerRes = await fetch(`${GRAPH}/${igMe.id}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caption: post.content,
            ...(post.image_url ? { image_url: post.image_url } : { media_type: 'TEXT' }),
            access_token: account.access_token,
          }),
        })
        const container = (await containerRes.json()) as { id?: string; error?: unknown }

        if (!container.id) {
          logError('social/publish', 'Instagram container creation failed', undefined, { container, postId })
          results[platform] = 'failed'
          continue
        }

        // Publish the container
        const publishRes = await fetch(`${GRAPH}/${igMe.id}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: container.id,
            access_token: account.access_token,
          }),
        })
        const publishData = (await publishRes.json()) as { id?: string; error?: unknown }

        if (!publishData.id) {
          logError('social/publish', 'Instagram publish failed', undefined, { publishData, postId })
          results[platform] = 'failed'
        } else {
          results[platform] = 'published'
        }
      }
    } catch (err) {
      logError('social/publish', `Unexpected error publishing to ${platform}`, err, { postId })
      results[platform] = 'failed'
    }
  }

  const allPublished = Object.values(results).every((r) => r === 'published')
  const anyPublished = Object.values(results).some((r) => r === 'published')
  const newStatus = allPublished ? 'published' : anyPublished ? 'published' : 'failed'

  const { error: updateErr } = await admin
    .from('scheduled_posts')
    .update({ status: newStatus })
    .eq('id', postId)

  if (updateErr) {
    logError('social/publish', 'Failed to update post status', updateErr, { postId, newStatus })
  }

  return NextResponse.json({ results, status: newStatus })
}
