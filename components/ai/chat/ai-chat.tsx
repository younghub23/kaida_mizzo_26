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
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { microLabel } from '@/app/(dashboard)/profile/ui'
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

// Per-mode accent ink — the category "text" color (Strategist = social, Analyst
// = content). Used for active-tab text, the user bubble ink, and tinted glyphs.
const MODE_ACCENT: Record<AiMode, string> = {
  content_strategist: '#A82C66', // cat-social-text
  data_analyst: '#1E7B82', // cat-content-text
}

// Per-mode soft tint — the category "soft" fill behind the active agent tab.
const MODE_SOFT: Record<AiMode, string> = {
  content_strategist: '#F9E4EE', // cat-social-soft
  data_analyst: '#DCF1F2', // cat-content-soft
}

// Per-mode dot — the category solid color tinting each conversation-list glyph.
const MODE_DOT: Record<AiMode, string> = {
  content_strategist: '#D6498C', // cat-social
  data_analyst: '#36B7C0', // cat-content
}

// Per-mode gradient for the agent avatar / welcome tile (warm for Strategist,
// cool for Analyst — these are the accents already encoded in the mockup).
const MODE_GRAD: Record<AiMode, string> = {
  content_strategist: 'linear-gradient(135deg,#D6488C,#E08A3C)',
  data_analyst: 'linear-gradient(135deg,#36B7C0,#9AC6E0)',
}

// The brand warm gradient — send button + the user message avatar.
const GRAD_WARM = 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)'

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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const modeMeta = getModeMeta(mode)
  const modeAllowed = (m: AiMode) => (m === 'data_analyst' ? canAnalyst : canStrategist)
  const currentAllowed = modeAllowed(mode)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  // Grow the composer with its content (capped), matching the mockup's textarea.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 170)}px`
  }, [input])

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
    <div className="tala-theme flex h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden bg-background text-foreground">
      {/* Conversation list column */}
      <aside className="hidden w-[300px] shrink-0 flex-col border-r border-border bg-background min-[900px]:flex">
        <div className="px-4 pb-3.5 pt-4">
          <Button onClick={startNew} className="w-full justify-center gap-2">
            <Plus className="size-4" />
            New conversation
          </Button>
        </div>
        <p className={cn(microLabel, 'px-5 pb-1.5 pt-2.5')}>Recent</p>
        <div className="flex-1 overflow-y-auto px-2.5 pb-4">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
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
                          'group flex items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-sm transition-colors hover:bg-muted',
                          isActive && 'bg-muted'
                        )}
                      >
                        <button
                          onClick={() => openConversation(c)}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                          title={c.title}
                        >
                          <Icon
                            className="size-[18px] shrink-0"
                            style={{ color: MODE_DOT[c.mode] }}
                          />
                          <span className="truncate">{c.title}</span>
                        </button>
                        <button
                          onClick={() => beginRename(c)}
                          className="hidden shrink-0 text-muted-foreground hover:text-foreground group-hover:block"
                          aria-label="Rename"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          className="hidden shrink-0 text-muted-foreground hover:text-destructive group-hover:block"
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
        {/* Chat header: agent tabs + decorative tagline */}
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3.5">
          <div className="inline-flex gap-[3px] rounded-xl border border-[rgba(164,141,120,.34)] bg-card p-1">
            {AI_MODES.map((m) => {
              const Icon = MODE_ICON[m.value]
              const active = m.value === mode
              const allowed = modeAllowed(m.value)
              return (
                <button
                  key={m.value}
                  onClick={() => switchMode(m.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-[9px] px-4 py-2 font-fredoka text-sm transition-all',
                    active
                      ? 'font-semibold shadow-[0_1px_3px_rgba(58,46,34,.08)]'
                      : 'font-medium text-muted-foreground hover:text-foreground'
                  )}
                  style={
                    active
                      ? { background: MODE_SOFT[m.value], color: MODE_ACCENT[m.value] }
                      : undefined
                  }
                >
                  <Icon className="size-[17px]" />
                  {m.label}
                  {!allowed && <Lock className="size-3" />}
                </button>
              )
            })}
          </div>
          <p className="hidden font-dm-serif text-[17px] italic text-primary min-[1180px]:block">
            {modeMeta.tagline}
          </p>
        </header>

        {/* Thread */}
        <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto px-6 py-11">
          {loadingThread ? (
            <div className="m-auto text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              mode={mode}
              onPick={(s) => send(s)}
              disabled={!currentAllowed}
            />
          ) : (
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[22px]">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} mode={mode} />
              ))}

              {sending && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {getModeMeta(mode).label} is thinking…
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border px-6 pb-5.5 pt-4">
          {currentAllowed ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
                className="relative mx-auto max-w-[880px]"
              >
                <textarea
                  ref={inputRef}
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
                  className="block max-h-[170px] min-h-[58px] w-full resize-none rounded-[16px] border border-[rgba(164,141,120,.34)] bg-card py-[17px] pl-[22px] pr-[62px] text-[15px] leading-normal shadow-[0_1px_0_rgba(255,255,255,.6)_inset] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(164,141,120,.15)]"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send"
                  className="absolute bottom-[9px] right-[9px] flex size-[42px] items-center justify-center rounded-full text-white shadow-[0_2px_10px_rgba(200,71,46,.28)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105 disabled:translate-y-0 disabled:opacity-50"
                  style={{ background: GRAD_WARM }}
                >
                  {sending ? <Loader2 className="size-[19px] animate-spin" /> : <Send className="size-[19px]" />}
                </button>
              </form>
              <p className="mt-2.5 text-center text-[11.5px] text-muted-foreground">
                Tala can make mistakes — double-check important details before publishing.
              </p>
            </>
          ) : (
            <div className="mx-auto max-w-[880px]">
              <LockedComposer mode={mode} />
            </div>
          )}
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
    <div className="m-auto flex w-full max-w-[540px] flex-col items-center text-center">
      <div
        className="mb-4 flex size-14 items-center justify-center rounded-[16px] text-white shadow-[0_8px_24px_rgba(214,72,140,.3)]"
        style={{ background: MODE_GRAD[mode] }}
      >
        <Icon className="size-7" />
      </div>
      <h2 className="mb-2.5 font-fredoka text-[22px] font-semibold">{meta.label}</h2>
      <p className="mb-6 max-w-[480px] text-sm leading-relaxed text-muted-foreground text-pretty">
        {meta.intro}
      </p>
      {!disabled && (
        <div className="flex w-full flex-col gap-2.5">
          {meta.starters.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="rounded-xl border border-border bg-card px-[19px] py-[15px] text-left text-sm shadow-[0_1px_0_rgba(255,255,255,.6)_inset] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px hover:border-primary hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message, mode }: { message: ChatMessage; mode: AiMode }) {
  const isUser = message.role === 'user'
  const Icon = MODE_ICON[mode]
  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <div
        className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] text-white"
        style={{ background: isUser ? GRAD_WARM : MODE_GRAD[mode] }}
        aria-hidden
      >
        {isUser ? <User className="size-[18px]" /> : <Icon className="size-[18px]" />}
      </div>
      <div
        className={cn(
          'max-w-[560px] whitespace-pre-wrap rounded-[14px] px-[17px] py-3.5 text-[14.5px] leading-relaxed',
          isUser
            ? 'bg-[#F9E4EE] text-[#A82C66]'
            : 'border border-border bg-card text-foreground shadow-[0_1px_0_rgba(255,255,255,.6)_inset]'
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
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-input bg-card p-4 text-center">
      <div className="flex items-center gap-2 font-fredoka text-sm font-semibold">
        <Lock className="size-4" />
        {meta.label} is a Pro &amp; Agency feature
      </div>
      <p className="text-sm text-muted-foreground">
        Upgrade your plan to unlock competitor intelligence and inspiration from your field.
      </p>
      <Button
        asChild
        size="sm"
        className="mt-1 border-0 text-white transition-[filter] hover:brightness-105"
        style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
      >
        <Link href="/plan">Upgrade plan</Link>
      </Button>
    </div>
  )
}
