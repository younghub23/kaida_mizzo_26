import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isCreator } from '@/lib/account'
import { microLabel, card } from '@/app/(dashboard)/profile/ui'

// Placeholder for Messages — the direct-message inbox where brand↔creator chats
// live. When a brand and creator connect in the Content Marketplace, their
// conversation is held and stored here. The real inbox is built later; for now
// this is an honest, on-brand empty state with no fabricated threads. Copy
// adapts to who's viewing.
export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const creator = isCreator(user)

  const subtitle = creator
    ? 'Your direct messages with brands, in one place.'
    : 'Your direct messages with creators, in one place.'

  const body = creator
    ? 'When you connect with a brand in the Content Marketplace, your conversation lives here. Once messaging is live, you’ll be able to reply and manage brand deals right from this inbox.'
    : 'When you connect with a creator in the Content Marketplace, your conversation lives here. Once messaging is live, you’ll be able to reply and manage partnerships right from this inbox.'

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8 max-[820px]:px-[22px]">
        <header>
          <span className={`${microLabel} mb-3.5 block`}>Inbox</span>
          <h1 className="font-fredoka text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] max-[820px]:text-[32px]">
            Messages
          </h1>
          <p className="mt-3 font-dm-serif text-[21px] italic text-muted-foreground">
            {subtitle}
          </p>
        </header>

        <div className={`${card} flex flex-col items-center gap-4 px-8 py-16 text-center`}>
          <span className="flex size-16 items-center justify-center rounded-[18px] bg-accent text-primary">
            <MessageSquare className="size-8" strokeWidth={1.8} />
          </span>
          <h2 className="font-fredoka text-2xl font-semibold">No messages yet</h2>
          <p className="max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
            {body}
          </p>
          <Link
            href="/marketplace"
            className="mt-2 inline-flex items-center gap-2 rounded-[11px] px-5 py-[11px] text-[14.5px] font-medium text-white shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105"
            style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
          >
            {creator ? 'Find brands to work with' : 'Find creators to work with'}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#8A715C]"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
