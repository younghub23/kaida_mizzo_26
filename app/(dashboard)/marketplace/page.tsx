import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Search, Store, X, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAccountType } from '@/lib/account'
import {
  listMarketplaceProfiles,
  buildMarketplaceRails,
  type MarketplaceSort,
} from '@/lib/marketplace'
import { parseBrandProfile } from '@/lib/brand'
import { parseCreatorProfile } from '@/lib/creator'
import { brandSignals, creatorSignals, hasSignals } from '@/lib/match'
import { MarketplaceCard } from '@/components/marketplace/profile-card'
import { MarketplaceRail } from '@/components/marketplace/rail'
import { VisibilityToggle } from '@/components/marketplace/visibility-toggle'
import { microLabel, card } from '@/app/(dashboard)/profile/ui'

const SORTS: { key: MarketplaceSort; label: string }[] = [
  { key: 'match', label: 'Best match' },
  { key: 'new', label: 'Newest' },
  { key: 'name', label: 'A–Z' },
]

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; sort?: string }>
}) {
  const { q, tag, sort: sortParam } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const viewerType = getAccountType(user)

  // Viewer's own match signals (drive match rings + recommendations).
  const { data: me } = await supabase
    .from('profiles')
    .select('industry, brand_profile, creator_profile, marketplace_visible')
    .eq('id', user.id)
    .single()
  const viewerSignals =
    viewerType === 'creator'
      ? creatorSignals(parseCreatorProfile(me?.creator_profile))
      : brandSignals(parseBrandProfile(me?.brand_profile), (me?.industry ?? '').trim())
  const canMatch = hasSignals(viewerSignals)

  const audienceLabel = viewerType === 'creator' ? 'brands' : 'creators'
  const lead =
    viewerType === 'creator'
      ? 'Find brands to partner with on your next deal.'
      : 'Find creators to market your products.'

  // Search / filter mode vs. browse (rails) mode.
  const searching = Boolean(q?.trim() || tag?.trim())

  const sort: MarketplaceSort =
    sortParam === 'new' || sortParam === 'name' || sortParam === 'match'
      ? sortParam
      : canMatch
        ? 'match'
        : 'name'

  const gridProfiles = searching
    ? await listMarketplaceProfiles({ viewerId: user.id, viewerType, q, tag, sort, viewerSignals })
    : []
  const rails = searching
    ? []
    : await buildMarketplaceRails({ viewerId: user.id, viewerType, viewerSignals })

  // Tag chips (grid mode) derived from the visible results.
  const tagCounts = new Map<string, number>()
  for (const p of gridProfiles) for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t)

  function withParams(next: Record<string, string | undefined>): string {
    const p = new URLSearchParams()
    const merged = { q: q?.trim(), tag: tag?.trim(), sort, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const s = p.toString()
    return `/marketplace${s ? `?${s}` : ''}`
  }

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8 max-[820px]:px-[22px]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
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
          </div>
          <VisibilityToggle initial={me?.marketplace_visible ?? true} />
        </header>

        {/* Search + (grid-mode) tag filters */}
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

          {searching && topTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {topTags.map((t) => {
                const active = tag?.toLowerCase() === t.toLowerCase()
                return (
                  <Link
                    key={t}
                    href={withParams({ tag: active ? undefined : t })}
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
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium text-primary hover:text-[#8A715C]"
              >
                <X className="size-3.5" />
                Clear
              </Link>
            </div>
          )}
        </div>

        {!canMatch && (
          <Link
            href={viewerType === 'creator' ? '/profile/creator' : '/profile/brand'}
            className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-medium text-primary hover:text-[#8A715C]"
          >
            <Sparkles className="size-3.5" />
            Complete your profile to unlock match scores and recommendations
          </Link>
        )}

        {searching ? (
          <>
            {/* Sort control */}
            <div className="flex items-center gap-1.5">
              {SORTS.map((s) => {
                if (s.key === 'match' && !canMatch) return null
                const active = sort === s.key
                return (
                  <Link
                    key={s.key}
                    href={withParams({ sort: s.key })}
                    className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60'
                    }`}
                  >
                    {s.label}
                  </Link>
                )
              })}
            </div>

            {gridProfiles.length === 0 ? (
              <EmptyState title="No matches yet" body="Try a different search or clear your filters." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gridProfiles.map((p, i) => (
                  <MarketplaceCard key={p.id} profile={p} paletteIndex={i} />
                ))}
              </div>
            )}
          </>
        ) : rails.length === 0 ? (
          <EmptyState
            title={`No ${audienceLabel} yet`}
            body={`As more ${audienceLabel} join Tala and complete their profiles, they'll show up here.`}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {rails.map((rail, i) => (
              <MarketplaceRail
                key={rail.key}
                title={rail.title}
                profiles={rail.profiles}
                seeAllHref={rail.seeAllTag ? `/marketplace?tag=${encodeURIComponent(rail.seeAllTag)}` : undefined}
                startPalette={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={`${card} flex flex-col items-center gap-3 px-8 py-16 text-center`}>
      <span className="flex size-14 items-center justify-center rounded-[16px] bg-accent text-primary">
        <Store className="size-7" strokeWidth={1.8} />
      </span>
      <h2 className="font-fredoka text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      <Link href="/marketplace" className="text-sm font-semibold text-primary hover:text-[#8A715C]">
        Back to marketplace
      </Link>
    </div>
  )
}
