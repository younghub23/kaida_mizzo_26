'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Sparkles,
  BarChart3,
  Lock,
  Send,
  Loader2,
  Check,
  X,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AI_MODES, DEFAULT_AI_MODE, getModeMeta, type AiMode } from '@/lib/ai/modes'
import {
  listConversations,
  getMessages,
  deleteConversation,
  renameConversation,
  type ConversationSummary,
  type ChatMessage,
} from '@/app/actions/ai-chat'

const MODE_ICON: Record<AiMode, typeof Sparkles> = {
  content_strategist: Sparkles,
  data_analyst: BarChart3,
}

type Props = {
  initialConversations: ConversationSummary[]
  canStrategist: boolean
  canAnalyst: boolean
}

export function AiChat({ initialConversations, canStrategist, canAnalyst }: Props) {
  const [conversations, setConversations] = useState(initialConversations)
  const [mode, setMode] = useState<AiMode>(DEFAULT_AI_MODE)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const modeMeta = getModeMeta(mode)
  const modeAllowed = (m: AiMode) => (m === 'data_analyst' ? canAnalyst : canStrategist)
  const currentAllowed = modeAllowed(mode)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function refresh() {
    setConversations(await listConversations())
  }

  function switchMode(next: AiMode) {
    if (next === mode) return
    setMode(next)
    setActiveId(null)
    setMessages([])
    setError(null)
  }

  function startNew() {
    setActiveId(null)
    setMessages([])
    setError(null)
  }

  async function openConversation(c: ConversationSummary) {
    if (c.id === activeId) return
    setActiveId(c.id)
    setMode(c.mode)
    setError(null)
    setLoadingThread(true)
    setMessages(await getMessages(c.id))
    setLoadingThread(false)
  }

  async function send(text?: string) {
    const value = (text ?? input).trim()
    if (!value || sending || !currentAllowed) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: value }]
    setMessages(next)
    setInput('')
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, mode, messages: next }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      setActiveId(data.conversationId)
      setMessages([...next, { role: 'assistant', content: data.assistant }])
      refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  async function remove(id: string) {
    await deleteConversation(id)
    if (id === activeId) startNew()
    refresh()
  }

  function beginRename(c: ConversationSummary) {
    setEditingId(c.id)
    setEditingTitle(c.title)
  }

  async function commitRename() {
    if (!editingId) return
    const title = editingTitle.trim()
    if (title) await renameConversation(editingId, title)
    setEditingId(null)
    setEditingTitle('')
    refresh()
  }

  return (
    <div className="flex h-screen">
      {/* Conversation sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border md:flex">
        <div className="p-3">
          <Button onClick={startNew} className="w-full justify-start gap-2">
            <Plus className="size-4" />
            New conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No conversations yet. Start one above.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {conversations.map((c) => {
                const Icon = MODE_ICON[c.mode]
                const isActive = c.id === activeId
                return (
                  <li key={c.id}>
                    {editingId === c.id ? (
                      <div className="flex items-center gap-1 px-1">
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename()
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                        />
                        <button onClick={commitRename} className="text-muted-foreground hover:text-foreground">
                          <Check className="size-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-muted',
                          isActive && 'bg-muted'
                        )}
                      >
                        <button
                          onClick={() => openConversation(c)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          title={c.title}
                        >
                          <Icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{c.title}</span>
                        </button>
                        <button
                          onClick={() => beginRename(c)}
                          className="hidden text-muted-foreground hover:text-foreground group-hover:block"
                          aria-label="Rename"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          className="hidden text-muted-foreground hover:text-destructive group-hover:block"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: role switcher */}
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            {AI_MODES.map((m) => {
              const Icon = MODE_ICON[m.value]
              const active = m.value === mode
              const allowed = modeAllowed(m.value)
              return (
                <button
                  key={m.value}
                  onClick={() => switchMode(m.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-4" />
                  {m.label}
                  {!allowed && <Lock className="size-3" />}
                </button>
              )
            })}
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">{modeMeta.tagline}</p>
        </header>

        {/* Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
            {loadingThread ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                mode={mode}
                onPick={(s) => send(s)}
                disabled={!currentAllowed}
              />
            ) : (
              messages.map((m, i) => <MessageBubble key={i} message={m} />)
            )}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {getModeMeta(mode).label} is thinking…
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border p-4">
          <div className="mx-auto max-w-3xl">
            {currentAllowed ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
                className="flex items-end gap-2 rounded-xl border border-input bg-transparent p-2 focus-within:border-ring"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  rows={1}
                  placeholder={`Message the ${getModeMeta(mode).label}…`}
                  className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
                />
                <Button type="submit" size="icon" disabled={sending || !input.trim()}>
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </form>
            ) : (
              <LockedComposer mode={mode} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  mode,
  onPick,
  disabled,
}: {
  mode: AiMode
  onPick: (starter: string) => void
  disabled: boolean
}) {
  const meta = getModeMeta(mode)
  const Icon = MODE_ICON[mode]
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-6 text-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{meta.label}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{meta.intro}</p>
      </div>
      {!disabled && (
        <div className="flex w-full max-w-md flex-col gap-2">
          {meta.starters.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm',
          isUser ? 'bg-foreground text-background' : 'bg-muted text-foreground'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}

function LockedComposer({ mode }: { mode: AiMode }) {
  const meta = getModeMeta(mode)
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-4 text-center">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Lock className="size-4" />
        {meta.label} is a Pro &amp; Agency feature
      </div>
      <p className="text-sm text-muted-foreground">
        Upgrade your plan to unlock competitor intelligence and inspiration from your field.
      </p>
      <Button asChild size="sm" className="mt-1">
        <Link href="/plan">Upgrade plan</Link>
      </Button>
    </div>
  )
}
