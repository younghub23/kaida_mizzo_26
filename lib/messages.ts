// ============================================================================
// Messages — server-side data layer for 1:1 brand<->creator DMs.
//
// Conversations + messages are protected by participant-only RLS, so the normal
// cookie-scoped client is used for the viewer's own rows. Reading the OTHER
// participant's public profile (name/avatar/headline) needs the service-role
// admin client, since profiles SELECT RLS is own-row-only.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCreatorProfile } from '@/lib/creator'
import { logError } from '@/lib/log'
import type { AccountType } from '@/lib/account'

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string
  attachmentUrl: string | null
  createdAt: string
  readAt: string | null
}

export type ConversationParticipant = {
  id: string
  name: string
  avatarUrl: string
  accountType: AccountType
  headline: string
}

export type ConversationSummary = {
  id: string
  other: ConversationParticipant
  lastMessagePreview: string
  lastMessageAt: string
  unread: number
}

export type ConversationThread = {
  id: string
  other: ConversationParticipant
  messages: ChatMessage[]
}

// Canonical participant ordering so a pair maps to exactly one conversation row.
function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

function fallbackParticipant(id: string): ConversationParticipant {
  return { id, name: 'Tala user', avatarUrl: '', accountType: 'business', headline: '' }
}

// Resolve public participant descriptors for a set of user ids (admin read).
async function fetchParticipants(
  ids: string[]
): Promise<Map<string, ConversationParticipant>> {
  const map = new Map<string, ConversationParticipant>()
  if (ids.length === 0) return map

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url, industry, account_type, creator_profile')
    .in('id', ids)

  for (const row of data ?? []) {
    const accountType: AccountType = row.account_type === 'creator' ? 'creator' : 'business'
    let headline: string
    if (accountType === 'creator') {
      const c = parseCreatorProfile(row.creator_profile)
      const h = c.handle.trim()
      headline = h ? (h.startsWith('@') ? h : `@${h}`) : 'Creator'
    } else {
      headline = (row.industry ?? '').trim() || 'Brand'
    }
    map.set(row.id, {
      id: row.id,
      name: (row.full_name ?? '').trim() || (accountType === 'creator' ? 'Creator' : 'Brand'),
      avatarUrl: (row.avatar_url ?? '').trim(),
      accountType,
      headline,
    })
  }
  return map
}

/**
 * Return the id of the 1:1 conversation between two users, creating it if
 * needed. Returns null on failure or if the ids are identical.
 */
export async function getOrCreateConversation(
  meId: string,
  otherId: string
): Promise<string | null> {
  if (!otherId || meId === otherId) return null
  const supabase = await createClient()
  const [low, high] = orderPair(meId, otherId)

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_low', low)
    .eq('user_high', high)
    .maybeSingle()
  if (existing?.id) return existing.id

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ user_low: low, user_high: high })
    .select('id')
    .maybeSingle()

  if (error) {
    // A concurrent insert may have won the unique race — re-select.
    const { data: retry } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_low', low)
      .eq('user_high', high)
      .maybeSingle()
    if (retry?.id) return retry.id
    logError('messages/getOrCreateConversation', 'Failed to create conversation', error, {
      meId,
      otherId,
    })
    return null
  }
  return created?.id ?? null
}

/** All of the viewer's conversations, newest activity first, with unread counts. */
export async function listConversations(meId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient()

  // RLS already restricts these to conversations the viewer is part of.
  const { data: convos } = await supabase
    .from('conversations')
    .select('id, user_low, user_high, last_message_preview, last_message_at')
    .order('last_message_at', { ascending: false })

  if (!convos || convos.length === 0) return []

  const otherIds = convos.map((c) => (c.user_low === meId ? c.user_high : c.user_low))
  const participants = await fetchParticipants(otherIds)

  // Unread = messages addressed to me that I haven't read. RLS scopes this to
  // my conversations, so one query covers them all.
  const { data: unreadRows } = await supabase
    .from('messages')
    .select('conversation_id')
    .is('read_at', null)
    .neq('sender_id', meId)

  const unreadMap = new Map<string, number>()
  for (const r of unreadRows ?? []) {
    unreadMap.set(r.conversation_id, (unreadMap.get(r.conversation_id) ?? 0) + 1)
  }

  return convos.map((c) => {
    const otherId = c.user_low === meId ? c.user_high : c.user_low
    return {
      id: c.id,
      other: participants.get(otherId) ?? fallbackParticipant(otherId),
      lastMessagePreview: c.last_message_preview ?? '',
      lastMessageAt: c.last_message_at,
      unread: unreadMap.get(c.id) ?? 0,
    }
  })
}

/** Load a single thread (messages + other participant), or null if not a member. */
export async function getConversationThread(
  meId: string,
  conversationId: string
): Promise<ConversationThread | null> {
  const supabase = await createClient()

  // RLS returns the row only if the viewer is a participant.
  const { data: convo } = await supabase
    .from('conversations')
    .select('id, user_low, user_high')
    .eq('id', conversationId)
    .maybeSingle()
  if (!convo) return null

  const otherId = convo.user_low === meId ? convo.user_high : convo.user_low
  const participants = await fetchParticipants([otherId])

  const { data: msgs } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, attachment_url, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const messages: ChatMessage[] = (msgs ?? []).map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    body: m.body,
    attachmentUrl: m.attachment_url ?? null,
    createdAt: m.created_at,
    readAt: m.read_at,
  }))

  return {
    id: conversationId,
    other: participants.get(otherId) ?? fallbackParticipant(otherId),
    messages,
  }
}

/** Total unread messages addressed to the viewer, across all conversations. */
export async function countUnreadMessages(meId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
    .neq('sender_id', meId)
  return count ?? 0
}

/** Mark every message the other participant sent in this thread as read. */
export async function markConversationRead(
  meId: string,
  conversationId: string
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', meId)
    .is('read_at', null)
}
