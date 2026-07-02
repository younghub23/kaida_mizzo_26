'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, SendHorizontal, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ConversationParticipant } from '@/lib/messages'

// Map a raw messages row (from realtime / insert) to our client shape.
function mapRow(row: {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  }
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// "Today" / "Yesterday" / a date, for the day separators.
function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
}

function sameDay(a: string, b: string): boolean {
  const x = new Date(a)
  const y = new Date(b)
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  )
}

// Live 1:1 chat. Messages are sent + received directly through the browser
// Supabase client (RLS restricts everything to the two participants), so the
// thread updates in real time via a postgres_changes subscription.
export function ThreadView({
  conversationId,
  meId,
  other,
  initialMessages,
}: {
  conversationId: string
  meId: string
  other: ConversationParticipant
  initialMessages: ChatMessage[]
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  // Create the browser Supabase client once (stable across renders).
  const [supabase] = useState(() => createClient())
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark the other side's messages as read.
  useEffect(() => {
    async function markRead() {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', meId)
        .is('read_at', null)
    }
    void markRead()
  }, [supabase, conversationId, meId, messages.length])

  // Subscribe to new + updated messages in this conversation.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = mapRow(payload.new as Parameters<typeof mapRow>[0])
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Reflect read receipts live (Sent → Seen when the other side reads).
          const updated = mapRow(payload.new as Parameters<typeof mapRow>[0])
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, readAt: updated.readAt } : m))
          )
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, conversationId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setDraft('')

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: meId, body: text })
      .select('id, conversation_id, sender_id, body, created_at, read_at')
      .single()

    if (error || !data) {
      toast.error('Failed to send message')
      setDraft(text)
      setSending(false)
      return
    }

    const sent = mapRow(data)
    setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))

    // Keep the inbox preview + ordering current.
    await supabase
      .from('conversations')
      .update({ last_message_at: sent.createdAt, last_message_preview: text.slice(0, 140) })
      .eq('id', conversationId)

    setSending(false)
  }

  return (
    <div className="tala-theme flex h-[calc(100vh-3.5rem)] flex-col bg-background font-sans text-foreground">
      {/* Thread header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-5 py-3">
        <Link
          href="/messages"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link
          href={`/marketplace/${other.id}`}
          className="flex min-w-0 items-center gap-3 rounded-[10px] px-1 py-1 transition-colors hover:bg-accent"
        >
          <span className="size-9 shrink-0 overflow-hidden rounded-full bg-accent ring-1 ring-foreground/10">
            {other.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={other.avatarUrl} alt={other.name} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center">
                <UserRound className="size-5 text-muted-foreground" />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-fredoka text-[15px] font-semibold leading-tight">
              {other.name}
            </p>
            {other.headline && (
              <p className="truncate text-[11.5px] text-muted-foreground">{other.headline}</p>
            )}
          </div>
        </Link>
      </div>

      {/* Message list */}
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-6">
        {messages.length === 0 ? (
          <div className="m-auto max-w-xs text-center text-sm text-muted-foreground">
            This is the start of your conversation with {other.name}. Say hello 👋
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.senderId === meId
            const showDay = i === 0 || !sameDay(messages[i - 1].createdAt, m.createdAt)
            // "Seen" / "Sent" belongs under the last message I sent.
            const isLastMine = mine && !messages.slice(i + 1).some((n) => n.senderId === meId)
            return (
              <div key={m.id} className="flex flex-col">
                {showDay && (
                  <div className="my-3 flex items-center justify-center">
                    <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      {dayLabel(m.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-[16px] px-4 py-2.5 text-[14.5px] leading-snug ${
                      mine
                        ? 'rounded-br-sm text-white'
                        : 'rounded-bl-sm border border-border bg-card text-foreground'
                    }`}
                    style={
                      mine
                        ? { background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }
                        : undefined
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  <span className="mt-1 px-1 text-[10.5px] text-muted-foreground">
                    {timeLabel(m.createdAt)}
                    {isLastMine && (m.readAt ? ' · Seen' : ' · Sent')}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="mx-auto flex w-full max-w-[760px] shrink-0 items-end gap-2 border-t border-border bg-card px-5 py-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend(e)
            }
          }}
          rows={1}
          placeholder={`Message ${other.name}`}
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-[12px] border border-input bg-background px-3.5 py-2.5 text-[14.5px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex size-[42px] shrink-0 items-center justify-center rounded-[12px] text-white transition-[filter,opacity] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
          aria-label="Send message"
        >
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  )
}
