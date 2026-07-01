import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Search, Store, UserRound, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAccountType } from '@/lib/account'
import { listMarketplaceProfiles, type MarketplaceProfile } from '@/lib/marketplace'
import { microLabel, card, cardLink, chipPalettes } from '@/app/(dashboard)/profile/ui'

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const { q, tag } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const viewerType = getAccountType(user)
  const profiles = await listMarketplaceProfiles({
    viewerId: user.id,
    viewerType,
    q,
    tag,
  })

  // Discovering the opposite side of the marketplace.
  const audienceLabel = viewerType === 'creator' ? 'brands' : 'creators'
  const lead =
    viewerType === 'creator'
      ? 'Find brands to partner with on your next deal.'
      : 'Find creators to market your products.'

  // Filter chips are derived from tags present in the results (real data only).
  const tagCounts = new Map<string, number>()
  for (const p of profiles) {
    for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t)

  const hasFilter = Boolean(q?.trim() || tag?.trim())

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
          <p className="mt-3 font-dm-serif text-[21px] italic text-muted-foreground">{lead}</p>
        </header>

        {/* Search + tag filters */}
        <div className={`${card} flex flex-col gap-4 p-5`}>
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ''}
                placeholder={`Search ${audienceLabel} by name`}
                className="h-10 w-full rounded-[11px] border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              />
            </div>
            {tag && <input type="hidden" name="tag" value={tag} />}
            <button
              type="submit"
              className="rounded-[11px] px-4 text-sm font-medium text-white transition-[filter] hover:brightness-105"
              style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
            >
              Search
            </button>
          </form>

          {topTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {topTags.map((t) => {
                const active = tag?.toLowerCase() === t.toLowerCase()
                const params = new URLSearchParams()
                if (q?.trim()) params.set('q', q.trim())
                if (!active) params.set('tag', t)
                const href = `/marketplace${params.toString() ? `?${params}` : ''}`
                return (
                  <Link
                    key={t}
                    href={href}
                    className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t}
                  </Link>
                )
              })}
              {hasFilter && (
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium text-primary hover:text-[#8A715C]"
                >
                  <X className="size-3.5" />
                  Clear
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {profiles.length === 0 ? (
          <div className={`${card} flex flex-col items-center gap-3 px-8 py-16 text-center`}>
            <span className="flex size-14 items-center justify-center rounded-[16px] bg-accent text-primary">
              <Store className="size-7" strokeWidth={1.8} />
            </span>
            <h2 className="font-fredoka text-xl font-semibold">
              {hasFilter ? 'No matches yet' : `No ${audienceLabel} yet`}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {hasFilter
                ? 'Try a different search or clear your filters.'
                : `As more ${audienceLabel} join Tala and complete their profiles, they'll show up here.`}
            </p>
            {hasFilter && (
              <Link
                href="/marketplace"
                className="text-sm font-semibold text-primary hover:text-[#8A715C]"
              >
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-[13px] text-muted-foreground">
              {profiles.length} {profiles.length === 1 ? audienceLabel.replace(/s$/, '') : audienceLabel}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p, i) => (
                <MarketplaceCard key={p.id} profile={p} paletteIndex={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MarketplaceCard({
  profile,
  paletteIndex,
}: {
  profile: MarketplaceProfile
  paletteIndex: number
}) {
  const palette = chipPalettes[paletteIndex % chipPalettes.length]
  return (
    <Link
      href={`/marketplace/${profile.id}`}
      className={`group flex flex-col gap-3 ${card} ${cardLink} p-5`}
    >
      <div className="flex items-center gap-3">
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
      </div>

      {profile.summary ? (
        <p className="line-clamp-2 text-[13.5px] leading-snug text-muted-foreground">
          {profile.summary}
        </p>
      ) : (
        <p className="text-[13.5px] italic text-muted-foreground/70">No bio yet.</p>
      )}

      {profile.tags.length > 0 && (
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
      )}
    </Link>
  )
}
