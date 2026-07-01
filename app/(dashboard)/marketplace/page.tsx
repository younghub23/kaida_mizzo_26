import Link from 'next/link'
import { Store, ArrowLeft } from 'lucide-react'
import { microLabel, card } from '@/app/(dashboard)/profile/ui'

// Placeholder for the Content Marketplace — a general marketplace where brands
// and creators connect. The real experience is built later; for now this is an
// honest, on-brand "coming soon" shell with no fabricated listings.
export default function MarketplacePage() {
  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8 max-[820px]:px-[22px]">
        <header>
          <span className={`${microLabel} mb-3.5 block`}>Discover</span>
          <h1 className="font-fredoka text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] max-[820px]:text-[32px]">
            Content{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(120deg,#D6488C,#E08A3C)' }}
            >
              Marketplace
            </span>
          </h1>
          <p className="mt-3 font-dm-serif text-[21px] italic text-muted-foreground">
            Where brands and creators find each other.
          </p>
        </header>

        <div className={`${card} flex flex-col items-center gap-4 px-8 py-16 text-center`}>
          <span
            className="flex size-16 items-center justify-center rounded-[18px] text-white shadow-[0_3px_12px_rgba(200,71,46,.28)]"
            style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
          >
            <Store className="size-8" strokeWidth={1.8} />
          </span>
          <h2 className="font-fredoka text-2xl font-semibold">Coming soon</h2>
          <p className="max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
            We&rsquo;re building a marketplace where brands and creators connect — browse
            partners, match on audience and values, and start conversations that turn into
            collaborations. Complete your profile now so you&rsquo;re ready when it opens.
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
