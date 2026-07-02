import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { MarketplaceProfile } from '@/lib/marketplace'
import { MarketplaceCard } from '@/components/marketplace/profile-card'

// A Netflix-style horizontal rail: a title and a snap-scrolling row of profile
// cards. The row scrolls horizontally on overflow; the scrollbar is hidden for a
// clean editorial look.
export function MarketplaceRail({
  title,
  profiles,
  seeAllHref,
  startPalette = 0,
}: {
  title: string
  profiles: MarketplaceProfile[]
  seeAllHref?: string
  startPalette?: number
}) {
  if (profiles.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-fredoka text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-primary hover:text-[#8A715C]"
          >
            See all <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {profiles.map((p, i) => (
          <MarketplaceCard
            key={p.id}
            profile={p}
            paletteIndex={startPalette + i}
            className="w-[248px] shrink-0 snap-start"
          />
        ))}
      </div>
    </section>
  )
}
