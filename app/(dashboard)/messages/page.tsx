import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquare, UserRound, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { listConversations, type ConversationSummary } from '@/lib/messages'
import { microLabel, card, cardLink } from '@/app/(dashboard)/profile/ui'

// Relative "time ago" for the inbox list.
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const s = Math.max(0, Math.round((now - then) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const conversations = await listConversations(user.id)

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[860px] flex-col gap-6 px-8 pb-14 pt-8 max-[820px]:px-[22px]">
        <header>
          <span className={`${microLabel} mb-3.5 block`}>Inbox</span>
          <h1 className="font-fredoka text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] max-[820px]:text-[32px]">
            Messages
          </h1>
          <p className="mt-3 font-dm-serif text-[21px] italic text-muted-foreground">
            Your conversations with brands and creators.
          </p>
        </header>

        {conversations.length === 0 ? (
          <div className={`${card} flex flex-col items-center gap-4 px-8 py-16 text-center`}>
            <span className="flex size-16 items-center justify-center rounded-[18px] bg-accent text-primary">
              <MessageSquare className="size-8" strokeWidth={1.8} />
            </span>
            <h2 className="font-fredoka text-2xl font-semibold">No messages yet</h2>
            <p className="max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
              When you connect with someone in the Content Marketplace, your conversation
              lives here. Find someone to work with to get started.
            </p>
            <Link
              href="/marketplace"
              className="mt-1 inline-flex items-center gap-2 rounded-[11px] px-5 py-[11px] text-[14.5px] font-medium text-white shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105"
              style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
            >
              <Store className="size-4" />
              Browse the marketplace
            </Link>
          </div>
        ) : (
          <div className={`${card} overflow-hidden`}>
            {conversations.map((c) => (
              <ConversationRow key={c.id} conversation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationRow({ conversation }: { conversation: ConversationSummary }) {
  const { other, lastMessagePreview, lastMessageAt, unread } = conversation
  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={`flex items-center gap-3.5 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-accent/40 ${cardLink}`}
    >
      <span className="size-11 shrink-0 overflow-hidden rounded-full bg-accent ring-1 ring-foreground/10">
        {other.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={other.avatarUrl} alt={other.name} className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center">
            <UserRound className="size-5 text-muted-foreground" />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate font-fredoka text-[15px] ${unread > 0 ? 'font-bold' : 'font-semibold'}`}>
            {other.name}
          </p>
          {other.headline && (
            <span className="shrink-0 text-[11px] text-muted-foreground">· {other.headline}</span>
          )}
        </div>
        <p
          className={`truncate text-[13px] ${
            unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
          }`}
        >
          {lastMessagePreview || 'No messages yet'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[11px] text-muted-foreground">{timeAgo(lastMessageAt)}</span>
        {unread > 0 && (
          <span
            className="flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white"
            style={{ background: 'linear-gradient(120deg,#D6488C,#E08A3C)' }}
          >
            {unread}
          </span>
        )}
      </div>
    </Link>
  )
}
