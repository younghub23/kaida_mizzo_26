// ============================================================================
// Content Marketplace — server-side data layer.
//
// The marketplace connects Tala brands and creators: brands browse creators to
// market their products, creators browse brands for deals. A profile is
// discoverable when marketplace_visible is true and it has a name.
//
// profiles SELECT RLS is own-row-only, so listing OTHER users' profiles is done
// with the service-role admin client — but we only ever select the public
// columns below (never email, plan, or stripe_customer_id).
// ============================================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { parseBrandProfile, type BrandProfile } from '@/lib/brand'
import { parseCreatorProfile, type CreatorProfile } from '@/lib/creator'
import {
  brandSignals,
  creatorSignals,
  scoreMatch,
  hasSignals,
  type MatchSignals,
  type MatchResult,
} from '@/lib/match'
import type { AccountType } from '@/lib/account'

// Only these columns ever leave the database for a marketplace read.
const PUBLIC_COLUMNS =
  'id, full_name, avatar_url, industry, account_type, brand_profile, creator_profile, created_at'

export type MarketplaceSort = 'match' | 'name' | 'new'

type ProfileRow = {
  id: string
  full_name: string | null
  avatar_url: string | null
  industry: string | null
  account_type: string | null
  brand_profile: unknown
  creator_profile: unknown
  created_at?: string | null
  marketplace_visible?: boolean
}

// A compact card for the directory grid.
export type MarketplaceProfile = {
  id: string
  accountType: AccountType
  name: string
  avatarUrl: string
  headline: string
  summary: string
  tags: string[]
  createdAt: string
  match: MatchResult | null
}

// Extract the match signals for any profile row (used to score against a viewer).
export function signalsForRow(row: {
  account_type: string | null
  industry: string | null
  brand_profile: unknown
  creator_profile: unknown
}): MatchSignals {
  if (normalizeType(row.account_type) === 'creator') {
    return creatorSignals(parseCreatorProfile(row.creator_profile))
  }
  return brandSignals(parseBrandProfile(row.brand_profile), (row.industry ?? '').trim())
}

// The full public profile for the detail page.
export type MarketplaceDetail = {
  id: string
  accountType: AccountType
  name: string
  avatarUrl: string
  headline: string
  industry: string
  brand: BrandProfile | null
  creator: CreatorProfile | null
}

function normalizeType(value: string | null): AccountType {
  return value === 'creator' ? 'creator' : 'business'
}

function formatHandle(handle: string): string {
  const h = handle.trim()
  if (!h) return ''
  return h.startsWith('@') ? h : `@${h}`
}

function toCard(row: ProfileRow, viewerSignals?: MatchSignals): MarketplaceProfile | null {
  const name = (row.full_name ?? '').trim()
  if (!name) return null
  const accountType = normalizeType(row.account_type)
  const avatarUrl = (row.avatar_url ?? '').trim()
  const createdAt = row.created_at ?? ''

  // Score against the viewer when both sides have supplied signals.
  const match =
    viewerSignals && hasSignals(viewerSignals)
      ? (() => {
          const target = signalsForRow(row)
          if (!hasSignals(target)) return null
          const result = scoreMatch(viewerSignals, target)
          return result.score > 0 ? result : null
        })()
      : null

  if (accountType === 'creator') {
    const c = parseCreatorProfile(row.creator_profile)
    return {
      id: row.id,
      accountType,
      name,
      avatarUrl,
      headline: formatHandle(c.handle) || c.primaryDemographic || 'Creator',
      summary: c.bio,
      tags: c.contentCategories,
      createdAt,
      match,
    }
  }

  const b = parseBrandProfile(row.brand_profile)
  return {
    id: row.id,
    accountType,
    name,
    avatarUrl,
    headline: (row.industry ?? '').trim() || b.brandType || 'Brand',
    summary: b.tagline || b.description,
    tags: b.contentTopics.length ? b.contentTopics : b.brandValues,
    createdAt,
    match,
  }
}

/**
 * List the OTHER side of the marketplace for a viewer: businesses see creators,
 * creators see brands. Supports an optional name search and a single tag filter.
 */
export async function listMarketplaceProfiles(params: {
  viewerId: string
  viewerType: AccountType
  q?: string
  tag?: string
  sort?: MarketplaceSort
  viewerSignals?: MatchSignals
}): Promise<MarketplaceProfile[]> {
  const admin = createAdminClient()
  const oppositeType: AccountType =
    params.viewerType === 'creator' ? 'business' : 'creator'

  let query = admin
    .from('profiles')
    .select(PUBLIC_COLUMNS)
    .eq('marketplace_visible', true)
    .eq('account_type', oppositeType)
    .neq('id', params.viewerId)
    .limit(200)

  const q = params.q?.trim()
  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data, error } = await query
  if (error || !data) return []

  let cards = (data as ProfileRow[])
    .map((row) => toCard(row, params.viewerSignals))
    .filter((c): c is MarketplaceProfile => c !== null)

  const tag = params.tag?.trim().toLowerCase()
  if (tag) {
    cards = cards.filter((c) => c.tags.some((t) => t.toLowerCase() === tag))
  }

  const byName = (a: MarketplaceProfile, b: MarketplaceProfile) =>
    a.name.localeCompare(b.name)
  const canMatch = Boolean(params.viewerSignals && hasSignals(params.viewerSignals))
  const sort: MarketplaceSort = params.sort ?? (canMatch ? 'match' : 'name')

  if (sort === 'new') {
    cards.sort((a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : byName(a, b)))
  } else if (sort === 'match' && canMatch) {
    cards.sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1) || byName(a, b))
  } else {
    cards.sort(byName)
  }

  return cards
}

/** Fetch a single public profile for the detail page. */
export async function getMarketplaceProfile(
  id: string
): Promise<MarketplaceDetail | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(`${PUBLIC_COLUMNS}, marketplace_visible`)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  const row = data as ProfileRow
  if (row.marketplace_visible === false) return null

  const name = (row.full_name ?? '').trim()
  const accountType = normalizeType(row.account_type)
  const creator = accountType === 'creator' ? parseCreatorProfile(row.creator_profile) : null

  return {
    id: row.id,
    accountType,
    name: name || (accountType === 'creator' ? 'Creator' : 'Brand'),
    avatarUrl: (row.avatar_url ?? '').trim(),
    headline: creator ? formatHandle(creator.handle) : (row.industry ?? '').trim(),
    industry: (row.industry ?? '').trim(),
    brand: accountType === 'business' ? parseBrandProfile(row.brand_profile) : null,
    creator,
  }
}
