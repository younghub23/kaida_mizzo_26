import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

export async function GET(req: NextRequest) {
  // When CRON_SECRET is configured, require it. The Cloudflare cron trigger
  // (worker.ts) sends it as a Bearer token. Without it set, the endpoint stays
  // open — set CRON_SECRET in production to lock it down.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: posts, error } = await admin
    .from('scheduled_posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (error) {
    logError('social/publish-due', 'Failed to fetch due posts', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
  const results: Array<{ id: string; ok: boolean }> = []

  for (const post of posts ?? []) {
    try {
      const res = await fetch(`${baseUrl}/api/social/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
        },
        body: JSON.stringify({ postId: post.id }),
      })
      results.push({ id: post.id, ok: res.ok })
    } catch (err) {
      logError('social/publish-due', 'Failed to publish post', err, { postId: post.id })
      results.push({ id: post.id, ok: false })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
