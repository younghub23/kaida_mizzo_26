import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversationThread, markConversationRead } from '@/lib/messages'
import { ThreadView } from './thread-view'

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thread = await getConversationThread(user.id, id)
  if (!thread) notFound()

  // Mark the other participant's messages read on open.
  await markConversationRead(user.id, id)

  return (
    <ThreadView
      conversationId={id}
      meId={user.id}
      other={thread.other}
      initialMessages={thread.messages}
    />
  )
}
