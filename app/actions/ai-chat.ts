'use server'

import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'
import { isAiMode, type AiMode } from '@/lib/ai/modes'

export type ConversationSummary = {
  id: string
  mode: AiMode
  title: string
  updatedAt: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

/** All of the current user's conversations, newest first. */
export async function listConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, mode, title, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    logError('ai-chat/list', 'Failed to load conversations', error)
    return []
  }

  return (data ?? []).map((c) => ({
    id: c.id as string,
    mode: isAiMode(c.mode) ? c.mode : 'content_strategist',
    title: (c.title as string) ?? 'New conversation',
    updatedAt: c.updated_at as string,
  }))
}

/** The messages of a conversation the user owns (RLS-enforced), oldest first. */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('ai_messages')
    .select('role, content, conversation_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    logError('ai-chat/messages', 'Failed to load messages', error, { conversationId })
    return []
  }

  return (data ?? []).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content as string,
  }))
}

export async function renameConversation(
  conversationId: string,
  title: string
): Promise<{ ok: boolean }> {
  const trimmed = title.trim().slice(0, 120)
  if (!trimmed) return { ok: false }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase
    .from('ai_conversations')
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    logError('ai-chat/rename', 'Failed to rename conversation', error, { conversationId })
    return { ok: false }
  }
  return { ok: true }
}

export async function deleteConversation(conversationId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  // ai_messages cascade-delete via the FK on conversation_id.
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    logError('ai-chat/delete', 'Failed to delete conversation', error, { conversationId })
    return { ok: false }
  }
  return { ok: true }
}
