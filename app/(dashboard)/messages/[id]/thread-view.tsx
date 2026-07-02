'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, SendHorizontal, UserRound, Paperclip, X, Loader2 } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, ConversationParticipant } from '@/lib/messages'

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  attachment_url: string | null
  created_at: string
  read_at: string | null
}

function mapRow(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    attachmentUrl: row.attachment_url ?? null,
    createdAt: row.created_at,
    readAt: row.read_at,
  }
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

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

// Live 1:1 chat with realtime delivery, read receipts, typing indicators, and
// image attachments — all through the browser Supabase client (RLS scopes
// everything to the two participants).
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
  const [attachment, setAttachment] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)

  const [supabase] = useState(() => createClient())
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingSentAt = useRef(0)
  const typingClear = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-scroll to the newest message / typing indicator.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // Mark the other side's messages as read whenever the thread changes.
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

  // Realtime: new + updated messages, and the other participant's typing pings.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = mapRow(payload.new as MessageRow)
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]))
          if (incoming.senderId !== meId) setOtherTyping(false)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const updated = mapRow(payload.new as MessageRow)
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, readAt: updated.readAt } : m)))
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId && payload.userId !== meId) {
          setOtherTyping(true)
          if (typingClear.current) clearTimeout(typingClear.current)
          typingClear.current = setTimeout(() => setOtherTyping(false), 2500)
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      if (typingClear.current) clearTimeout(typingClear.current)
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [supabase, conversationId, meId])

  // Broadcast a throttled "typing" ping as the viewer types.
  function pingTyping() {
    const now = Date.now()
    if (now - typingSentAt.current < 1500) return
    typingSentAt.current = now
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: meId } })
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload-post-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.url) setAttachment(data.url)
      else toast.error(data.error ?? 'Upload failed')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if ((!text && !attachment) || sending || uploading) return
    setSending(true)
    const pendingAttachment = attachment
    setDraft('')
    setAttachment(null)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: meId,
        body: text,
        attachment_url: pendingAttachment,
      })
      .select('id, conversation_id, sender_id, body, attachment_url, created_at, read_at')
      .single()

    if (error || !data) {
      toast.error('Failed to send message')
      setDraft(text)
      setAttachment(pendingAttachment)
      setSending(false)
      return
    }

    const sent = mapRow(data as MessageRow)
    setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]))

    const preview = text || (pendingAttachment ? '📷 Photo' : '')
    await supabase
      .from('conversations')
      .update({ last_message_at: sent.createdAt, last_message_preview: preview.slice(0, 140) })
      .eq('id', conversationId)

    setSending(false)
  }

  const canSend = (draft.trim() || attachment) && !sending && !uploading

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
            <p className="truncate font-fredoka text-[15px] font-semibold leading-tight">{other.name}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {otherTyping ? (
                <span className="text-[#1E7B82]">typing…</span>
              ) : (
                other.headline
              )}
            </p>
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
                    className={`max-w-[78%] overflow-hidden rounded-[16px] text-[14.5px] leading-snug ${
                      mine
                        ? 'rounded-br-sm text-white'
                        : 'rounded-bl-sm border border-border bg-card text-foreground'
                    }`}
                    style={mine ? { background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' } : undefined}
                  >
                    {m.attachmentUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.attachmentUrl}
                        alt="Attachment"
                        className="max-h-72 w-full object-cover"
                      />
                    )}
                    {m.body && <p className="whitespace-pre-wrap break-words px-4 py-2.5">{m.body}</p>}
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
        {otherTyping && (
          <div className="flex items-center gap-1.5 px-1 py-1">
            <span className="flex gap-1 rounded-[14px] border border-border bg-card px-3 py-2.5">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="mx-auto w-full max-w-[760px] shrink-0 border-t border-border bg-card px-5 py-3">
        {attachment && (
          <div className="mb-2 flex items-center gap-2">
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment} alt="Attachment preview" className="size-16 rounded-[10px] object-cover" />
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                aria-label="Remove attachment"
              >
                <X className="size-3" />
              </button>
            </span>
            <span className="text-[12.5px] text-muted-foreground">Photo attached</span>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || sending}
            className="flex size-[42px] shrink-0 items-center justify-center rounded-[12px] border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            aria-label="Attach a photo"
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <Paperclip className="size-5" />}
          </button>
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              pingTyping()
            }}
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
            disabled={!canSend}
            className="flex size-[42px] shrink-0 items-center justify-center rounded-[12px] text-white transition-[filter,opacity] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
            aria-label="Send message"
          >
            <SendHorizontal className="size-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

// Animated typing dot.
function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: delay, animationDuration: '1s' }}
    />
  )
}
