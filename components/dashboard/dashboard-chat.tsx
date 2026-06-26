'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_AI_MODE } from '@/lib/ai/modes'

type Msg = { role: 'user' | 'assistant'; content: string }

const QUICK_REPLIES = ['Summarize my week', 'Draft a caption', 'Best time to post?']

const GREETING =
  "Hi! I'm your Tala assistant 👋 I can summarize your analytics, draft captions, or plan your week. What would you like to do?"

// Brand gradients (the vivid palette — see the design reference).
const GRAD_WARM = 'linear-gradient(135deg,#D6488C,#E08A3C)'
const GRAD_USER = 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)'
const GRAD_BAND =
  'linear-gradient(100deg, rgba(214,72,140,.16), rgba(54,182,192,.14) 60%, rgba(224,138,60,.16))'

/**
 * Small top-right popover chat, wired to the real streaming `/api/ai/chat`
 * endpoint (the same NDJSON-frame protocol the full AI page uses). The seeded
 * greeting is presentation only and is never sent to the model; the API always
 * receives a conversation whose last turn is the user's.
 */
export function DashboardChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep the latest message in view as it streams.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, error])

  // Focus the input when the popover opens.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 180)
  }, [open])

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Close on outside click (but let the top-bar toggle button handle itself).
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (boxRef.current?.contains(target)) return
      if (target?.closest('[data-chat-toggle]')) return
      onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, onClose])

  async function send(text?: string) {
    const value = (text ?? input).trim()
    if (!value || sending) return

    const base: Msg[] = [...messages, { role: 'user', content: value }]
    setMessages(base)
    setInput('')
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, mode: DEFAULT_AI_MODE, messages: base }),
      })

      // Pre-flight failures (validation, plan gating, auth) come back as JSON.
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Something went wrong. Please try again.')
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
            if (frame.conversationId) setConversationId(frame.conversationId)
            openAssistant()
          } else if (frame.type === 'delta') {
            openAssistant()
            appendDelta(frame.text ?? '')
          } else if (frame.type === 'error') {
            setError(frame.error ?? 'Something went wrong.')
            // Drop a trailing empty assistant bubble if nothing streamed.
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (last && last.role === 'assistant' && last.content === '') return prev.slice(0, -1)
              return prev
            })
          }
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-label="Tala AI chat"
      aria-hidden={!open}
      className={cn(
        'tala-theme fixed right-[18px] top-16 z-[60] w-[340px] max-w-[calc(100vw-36px)] origin-top-right overflow-hidden rounded-2xl border bg-card text-foreground shadow-[0_18px_48px_rgba(58,46,34,.22)] transition-all duration-200 ease-out',
        open
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none -translate-y-2 scale-[.97] opacity-0'
      )}
      style={{ borderColor: 'rgba(164,141,120,.34)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 border-b border-border px-4 py-3"
        style={{ background: GRAD_BAND }}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-white"
          style={{ background: GRAD_WARM }}
        >
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-fredoka text-sm font-semibold">Tala AI</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px]" style={{ color: '#1E7B82' }}>
            <span className="size-1.5 rounded-full" style={{ background: '#36B7C0' }} />
            Online
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-md px-1.5 py-0.5 text-xl leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          &times;
        </button>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="flex h-[300px] flex-col gap-2.5 overflow-y-auto bg-background p-4"
      >
        <Bubble role="assistant">{GREETING}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content || (sending && i === messages.length - 1 ? '…' : '')}
          </Bubble>
        ))}
        {error && (
          <div className="max-w-[90%] self-start rounded-xl rounded-bl-[5px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] leading-snug text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Quick replies */}
      <div className="flex flex-wrap gap-1.5 bg-background px-4 pb-3">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={sending}
            className="rounded-full border bg-card px-2.5 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            style={{ borderColor: 'rgba(164,141,120,.34)' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className="flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Tala anything…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-[13px] outline-none focus:border-primary"
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
    </div>
  )
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  if (role === 'user') {
    return (
      <div
        className="max-w-[82%] self-end whitespace-pre-wrap rounded-xl rounded-br-[5px] px-3 py-2 text-[13px] leading-snug text-white"
        style={{ background: GRAD_USER }}
      >
        {children}
      </div>
    )
  }
  return (
    <div className="max-w-[82%] self-start whitespace-pre-wrap rounded-xl rounded-bl-[5px] border border-border bg-card px-3 py-2 text-[13px] leading-snug">
      {children}
    </div>
  )
}
