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

  for (const platform of ['facebook', 'instagram', 'linkedin', 'tiktok'] as const) {
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
        const igMeRes = await fetch(`${GRAPH}/me?fields=id&access_token=${account.access_token}`)
        const igMe = (await igMeRes.json()) as { id?: string }

        if (!igMe.id) {
          logError('social/publish', 'No Instagram user ID', undefined, { postId })
          results[platform] = 'failed'
          continue
        }

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
      } else if (platform === 'linkedin') {
        // Get LinkedIn user URN
        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${account.access_token}` },
        })
        const profile = (await profileRes.json()) as { sub?: string }

        if (!profile.sub) {
          logError('social/publish', 'No LinkedIn user ID', undefined, { postId })
          results[platform] = 'failed'
          continue
        }

        const postRes = await fetch('https://api.linkedin.com/v2/posts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify({
            author: `urn:li:person:${profile.sub}`,
            commentary: post.content,
            visibility: 'PUBLIC',
            distribution: { feedDistribution: 'MAIN_FEED' },
            lifecycleState: 'PUBLISHED',
          }),
        })

        if (!postRes.ok) {
          const errBody = await postRes.text()
          logError('social/publish', 'LinkedIn publish failed', undefined, { errBody, postId })
          results[platform] = 'failed'
        } else {
          results[platform] = 'published'
        }
      } else if (platform === 'tiktok') {
        // TikTok Content Posting API — initialize a direct post
        const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_info: {
              title: post.content?.slice(0, 150) ?? '',
              privacy_level: 'SELF_ONLY',
            },
            source_info: {
              source: 'PULL_FROM_URL',
              video_url: post.image_url ?? '',
            },
          }),
        })
        const initData = (await initRes.json()) as {
          data?: { publish_id?: string }
          error?: { code?: string; message?: string }
        }

        if (!initData.data?.publish_id) {
          logError('social/publish', 'TikTok publish failed', undefined, { initData, postId })
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
