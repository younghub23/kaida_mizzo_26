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

// Per-mode accent ink (Strategist = social, Analyst = content).
const MODE_ACCENT: Record<AiMode, string> = {
  content_strategist: '#A82C66',
  data_analyst: '#1E7B82',
}

// Brand gradients (the vivid palette — see the design reference / dashboard-chat).
const GRAD_WARM = 'linear-gradient(135deg,#D6488C,#E08A3C)' // avatar / send button
const GRAD_USER = 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' // user bubble
const GRAD_BAND = 'linear-gradient(100deg,#F9E4EE,#EAE3D6)' // soft active band
const GRAD_BAR = 'linear-gradient(#D6488C,#E08A3C)' // 3px active accent bar

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

    const base: ChatMessage[] = [...messages, { role: 'user', content: value }]
    setMessages(base)
    setInput('')
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, mode, messages: base }),
      })

      // Pre-flight failures (validation, gating, auth) come back as JSON.
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}) as { error?: string })
        setError(data.error ?? 'Something went wrong')
        return
      }

      // Success: a stream of newline-delimited JSON frames.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantOpen = false

      const openAssistant = () => {
        if (assistantOpen) return
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
        assistantOpen = true
      }
      const appendDelta = (delta: string) =>
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: last.content + delta }
          }
          return copy
        })

      for (;;) {
        const { value: chunk, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(chunk, { stream: true })

        let nl = buffer.indexOf('\n')
        while (nl !== -1) {
          const line = buffer.slice(0, nl).trim()
          buffer = buffer.slice(nl + 1)
          nl = buffer.indexOf('\n')
          if (!line) continue

          let frame: { type: string; conversationId?: string; text?: string; error?: string }
          try {
            frame = JSON.parse(line)
          } catch {
            continue
          }

          if (frame.type === 'meta') {
            if (frame.conversationId) setActiveId(frame.conversationId)
            openAssistant()
          } else if (frame.type === 'delta') {
            openAssistant()
            appendDelta(frame.text ?? '')
          } else if (frame.type === 'error') {
            setError(frame.error ?? 'Something went wrong')
            // Drop a trailing empty assistant bubble if nothing streamed.
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (last && last.role === 'assistant' && last.content === '') return prev.slice(0, -1)
              return prev
            })
          }
        }
      }

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
    <div className="tala-theme flex h-[calc(100vh-3.5rem)] bg-background text-foreground">
      {/* Conversation sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card md:flex">
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
                          'group relative flex items-center gap-2 overflow-hidden rounded-lg px-2.5 py-2 text-sm',
                          isActive
                            ? 'font-semibold text-foreground'
                            : 'hover:bg-muted'
                        )}
                        style={isActive ? { background: GRAD_BAND } : undefined}
                      >
                        {isActive && (
                          <span
                            aria-hidden
                            className="absolute inset-y-1.5 left-0 w-[3px] rounded-full"
                            style={{ background: GRAD_BAR }}
                          />
                        )}
                        <button
                          onClick={() => openConversation(c)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          title={c.title}
                        >
                          <Icon
                            className={cn('size-4 shrink-0', !isActive && 'text-muted-foreground')}
                            style={isActive ? { color: MODE_ACCENT[c.mode] } : undefined}
                          />
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
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="inline-flex rounded-lg border border-border bg-background/60 p-1">
            {AI_MODES.map((m) => {
              const Icon = MODE_ICON[m.value]
              const active = m.value === mode
              const allowed = modeAllowed(m.value)
              return (
                <button
                  key={m.value}
                  onClick={() => switchMode(m.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'font-semibold text-foreground'
                      : 'font-medium text-muted-foreground hover:text-foreground'
                  )}
                  style={active ? { background: GRAD_BAND } : undefined}
                >
                  <Icon
                    className="size-4"
                    style={active ? { color: MODE_ACCENT[m.value] } : undefined}
                  />
                  {m.label}
                  {!allowed && <Lock className="size-3" />}
                </button>
              )
            })}
          </div>
          <p className="hidden font-dm-serif text-sm italic text-muted-foreground sm:block">
            {modeMeta.tagline}
          </p>
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

            {sending && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {getModeMeta(mode).label} is thinking…
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-card p-4">
          <div className="mx-auto max-w-3xl">
            {currentAllowed ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
                className="flex items-end gap-2 rounded-2xl border border-input bg-background p-2 focus-within:border-primary"
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
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-[filter] hover:brightness-105 disabled:opacity-50"
                  style={{ background: GRAD_WARM }}
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
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
      <div
        className="flex size-12 items-center justify-center rounded-xl text-white"
        style={{ background: GRAD_WARM }}
      >
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="font-fredoka text-lg font-semibold">{meta.label}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{meta.intro}</p>
      </div>
      {!disabled && (
        <div className="flex w-full max-w-md flex-col gap-2">
          {meta.starters.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:border-[#D6498C] hover:bg-[#F9E4EE] hover:text-[#A82C66]"
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
          isUser
            ? 'rounded-br-[5px] text-white'
            : 'rounded-bl-[5px] border border-border bg-card text-foreground'
        )}
        style={isUser ? { background: GRAD_USER } : undefined}
      >
        {message.content}
      </div>
    </div>
  )
}

function LockedComposer({ mode }: { mode: AiMode }) {
  const meta = getModeMeta(mode)
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-input bg-card p-4 text-center">
      <div className="flex items-center gap-2 font-fredoka text-sm font-semibold">
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
