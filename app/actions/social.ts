// Run in Supabase SQL editor:
//
// CREATE TABLE IF NOT EXISTS scheduled_posts (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
//   content text NOT NULL,
//   image_url text,
//   platforms text[] NOT NULL DEFAULT '{}',
//   scheduled_at timestamptz NOT NULL,
//   status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'draft')),
//   created_at timestamptz DEFAULT now()
// );
// ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users manage own posts" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

export type ScheduledPost = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  platforms: string[]
  scheduled_at: string
  status: 'scheduled' | 'published' | 'failed' | 'draft'
  created_at: string
}

export type SocialActionState = {
  error: string | null
  success: boolean
}

export async function schedulePost(
  _prevState: SocialActionState,
  formData: FormData
): Promise<SocialActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', success: false }
  }

  const content = formData.get('content') as string
  const imageUrl = formData.get('imageUrl') as string | null
  const scheduledAt = formData.get('scheduledAt') as string
  const intent = formData.get('intent') as string
  const platforms = formData.getAll('platforms') as string[]

  if (!content || !scheduledAt || platforms.length === 0) {
    return { error: 'Please fill in content, platforms, and schedule time', success: false }
  }

  const isNow = intent === 'now'

  const { error } = await supabase.from('scheduled_posts').insert({
    user_id: user.id,
    content,
    image_url: imageUrl || null,
    platforms,
    scheduled_at: isNow ? new Date().toISOString() : new Date(scheduledAt).toISOString(),
    status: isNow ? 'published' : 'scheduled',
  })

  if (error) {
    logError('social/schedulePost', 'Failed to insert scheduled post', error, { userId: user.id })
    return { error: error.message, success: false }
  }

  revalidatePath('/social')

  return { error: null, success: true }
}

export async function getPosts(): Promise<ScheduledPost[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true })

  if (error || !data) {
    if (error) logError('social/getPosts', 'Failed to fetch scheduled posts', error, { userId: user.id })
    return []
  }

  return data as ScheduledPost[]
}

export async function deletePost(id: string): Promise<SocialActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', success: false }
  }

  const { error } = await supabase
    .from('scheduled_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    logError('social/deletePost', 'Failed to delete scheduled post', error, { userId: user.id, postId: id })
    return { error: error.message, success: false }
  }

  revalidatePath('/social')

  return { error: null, success: true }
}
