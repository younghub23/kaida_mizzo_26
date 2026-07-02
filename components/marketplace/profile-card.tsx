import Link from 'next/link'
import { UserRound } from 'lucide-react'
import type { MarketplaceProfile } from '@/lib/marketplace'
import { matchReasons } from '@/lib/match'
import { MatchRing } from '@/components/marketplace/match-ring'
import { cn } from '@/lib/utils'
import { card, cardLink, chipPalettes } from '@/app/(dashboard)/profile/ui'

// A marketplace profile card — used in the search grid, the Netflix-style rails,
// and the dashboard "Recommended for you" rail. Shows the match ring + shared
// reasons when a match was computed, otherwise falls back to the profile's tags.
export function MarketplaceCard({
  profile,
  paletteIndex = 0,
  className,
}: {
  profile: MarketplaceProfile
  paletteIndex?: number
  className?: string
}) {
  const palette = chipPalettes[paletteIndex % chipPalettes.length]
  const reasons = profile.match ? matchReasons(profile.match) : []

  return (
    <Link
      href={`/marketplace/${profile.id}`}
      className={cn('group flex flex-col gap-3 p-5', card, cardLink, className)}
    >
      <div className="flex items-start gap-3">
        <span className="size-12 shrink-0 overflow-hidden rounded-full bg-accent ring-1 ring-foreground/10">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.name} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <UserRound className="size-6 text-muted-foreground" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-fredoka text-[16px] font-semibold leading-tight">
            {profile.name}
          </p>
          {profile.headline && (
            <p className="truncate text-[12.5px] font-medium text-primary">{profile.headline}</p>
          )}
        </div>
        {profile.match && <MatchRing score={profile.match.score} />}
      </div>

      {profile.summary ? (
        <p className="line-clamp-2 text-[13.5px] leading-snug text-muted-foreground">
          {profile.summary}
        </p>
      ) : (
        <p className="text-[13.5px] italic text-muted-foreground/70">No bio yet.</p>
      )}

      {reasons.length > 0 ? (
        <p className="mt-auto pt-1 text-[12px] text-muted-foreground">
          <span className="font-medium text-[#A82C66]">Shared:</span> {reasons.join(' · ')}
        </p>
      ) : (
        profile.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {profile.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium"
                style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
              >
                {t}
              </span>
            ))}
          </div>
        )
      )}
    </Link>
  )
}
