import Link from 'next/link'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { microLabel, card } from '@/app/(dashboard)/profile/ui'

// Placeholder for Messages — conversations with brands who reach out through the
// Content Marketplace. The real inbox is built later; for now this is an honest,
// on-brand empty state with no fabricated threads.
export default function MessagesPage() {
  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8 max-[820px]:px-[22px]">
        <header>
          <span className={`${microLabel} mb-3.5 block`}>Inbox</span>
          <h1 className="font-fredoka text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] max-[820px]:text-[32px]">
            Messages
          </h1>
          <p className="mt-3 font-dm-serif text-[21px] italic text-muted-foreground">
            Conversations with brands who find you in the marketplace.
          </p>
        </header>

        <div className={`${card} flex flex-col items-center gap-4 px-8 py-16 text-center`}>
          <span className="flex size-16 items-center justify-center rounded-[18px] bg-accent text-primary">
            <MessageSquare className="size-8" strokeWidth={1.8} />
          </span>
          <h2 className="font-fredoka text-2xl font-semibold">No messages yet</h2>
          <p className="max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
            Brands who reach out through the Content Marketplace will show up here. Once
            messaging is live, you&rsquo;ll be able to reply and manage partnerships right
            from this inbox.
          </p>
          <Link
            href="/dashboard"
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#8A715C]"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
