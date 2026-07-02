import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getAccountType } from '@/lib/account'
import { parseBrandProfile } from '@/lib/brand'
import { parseCreatorProfile } from '@/lib/creator'
import { brandSignals, creatorSignals } from '@/lib/match'
import { getRecommendedProfiles } from '@/lib/marketplace'
import { MarketplaceRail } from '@/components/marketplace/rail'

// A "Recommended for you" rail for the dashboards — the viewer's best marketplace
// matches, computed from their real profile signals. Renders nothing when the
// viewer has no usable profile or no positive matches (no filler).
export async function RecommendedRail({ user, limit = 10 }: { user: User; limit?: number }) {
  const accountType = getAccountType(user)
  const supabase = await createClient()

  const { data: me } = await supabase
    .from('profiles')
    .select('industry, brand_profile, creator_profile')
    .eq('id', user.id)
    .single()

  const viewerSignals =
    accountType === 'creator'
      ? creatorSignals(parseCreatorProfile(me?.creator_profile))
      : brandSignals(parseBrandProfile(me?.brand_profile), (me?.industry ?? '').trim())

  const profiles = await getRecommendedProfiles({
    viewerId: user.id,
    viewerType: accountType,
    viewerSignals,
    limit,
  })

  if (profiles.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
          {accountType === 'creator' ? 'Brands for you' : 'Creators for you'}
        </p>
      </div>
      <MarketplaceRail title="Recommended for you" profiles={profiles} seeAllHref="/marketplace" />
    </div>
  )
}
