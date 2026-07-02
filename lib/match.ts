// ============================================================================
// Marketplace matching — a real compatibility score between a brand and a
// creator, computed from the profile fields they actually filled in.
//
// Three dimensions, each contributing a weighted sub-score:
//   • Values     — shared brand values / creator values          (weight 40)
//   • Content    — overlapping content categories / topics / niche (weight 35)
//   • Audience   — overlapping target generations                 (weight 25)
//
// The score is 0–100. It is honest: with no overlap (or empty profiles) it is 0,
// and we only surface a match when BOTH sides have supplied the relevant data.
// No fabricated affinity.
// ============================================================================

import type { BrandProfile } from '@/lib/brand'
import type { CreatorProfile } from '@/lib/creator'

export type MatchSignals = {
  values: string[]
  topics: string[]
  audiences: string[] // generation bucket keys
}

export type MatchResult = {
  score: number
  sharedValues: string[]
  sharedTopics: string[]
  sharedAudiences: string[] // human labels
}

const norm = (s: string) => s.trim().toLowerCase()

// Coarse generation buckets, so a creator's "Gen Z (13–24)" and a brand's
// "18–24" target land in the same space.
const GEN_LABELS: Record<string, string> = {
  genz: 'Gen Z',
  millennial: 'Millennials',
  genx: 'Gen X',
  boomer: 'Boomers',
}

// Map an age-range string ("18–24", "65+") or a generation label
// ("Gen Z (13–24)") to one or more generation buckets.
function ageToGenerations(value: string): string[] {
  const t = norm(value)
  if (!t) return []
  if (t.includes('gen z')) return ['genz']
  if (t.includes('millennial')) return ['millennial']
  if (t.includes('gen x')) return ['genx']
  if (t.includes('boomer')) return ['boomer']

  const lower = parseInt(t, 10)
  if (Number.isNaN(lower)) return []
  if (lower <= 24) return ['genz']
  if (lower <= 34) return ['millennial']
  if (lower <= 40) return ['millennial']
  if (lower <= 44) return ['millennial', 'genx']
  if (lower <= 56) return ['genx']
  if (lower <= 64) return ['genx', 'boomer']
  return ['boomer']
}

function uniq(items: string[]): string[] {
  return [...new Set(items)]
}

export function creatorSignals(c: CreatorProfile): MatchSignals {
  return {
    values: uniq(c.values.filter(Boolean)),
    topics: uniq(c.contentCategories.filter(Boolean)),
    audiences: uniq(ageToGenerations(c.primaryDemographic)),
  }
}

export function brandSignals(b: BrandProfile, industry: string): MatchSignals {
  const topics = uniq(
    [...b.contentTopics, industry, b.brandType].filter((t) => t && t.trim())
  )
  const audiences = uniq(b.targetAgeRanges.flatMap(ageToGenerations))
  return {
    values: uniq(b.brandValues.filter(Boolean)),
    topics,
    audiences,
  }
}

export const EMPTY_SIGNALS: MatchSignals = { values: [], topics: [], audiences: [] }

export function hasSignals(s: MatchSignals): boolean {
  return s.values.length > 0 || s.topics.length > 0 || s.audiences.length > 0
}

// Items in `a` that exactly match (case-insensitive) something in `b`.
function sharedExact(a: string[], b: string[]): string[] {
  const set = new Set(b.map(norm))
  return a.filter((x) => set.has(norm(x)))
}

// Items in `a` that match something in `b` exactly OR by containment (either
// direction, for tokens longer than 3 chars). Handles "Beauty" vs "beauty tips".
function sharedFuzzy(a: string[], b: string[]): string[] {
  const bn = b.map(norm)
  return a.filter((x) => {
    const xn = norm(x)
    return bn.some(
      (y) =>
        y === xn ||
        (xn.length > 3 && y.includes(xn)) ||
        (y.length > 3 && xn.includes(y))
    )
  })
}

// Diminishing-returns curve: the first shared item counts a lot, more push
// toward a perfect sub-score.
function curve(count: number, full: number): number {
  if (count <= 0) return 0
  if (count >= full) return 1
  return count / full
}

/**
 * Score compatibility between two profiles' signals (0–100) and collect the
 * concrete overlaps to explain the match. Order-independent.
 */
export function scoreMatch(a: MatchSignals, b: MatchSignals): MatchResult {
  const sharedValues = sharedExact(a.values, b.values)
  const sharedTopics = uniq(sharedFuzzy(a.topics, b.topics))
  const sharedAudienceKeys = a.audiences.filter((x) => b.audiences.includes(x))
  const sharedAudiences = sharedAudienceKeys.map((k) => GEN_LABELS[k] ?? k)

  // A dimension only contributes when both sides supplied data for it.
  const valuesActive = a.values.length > 0 && b.values.length > 0
  const topicsActive = a.topics.length > 0 && b.topics.length > 0
  const audiencesActive = a.audiences.length > 0 && b.audiences.length > 0

  const vNorm = valuesActive ? curve(sharedValues.length, 3) : 0
  const tNorm = topicsActive ? curve(sharedTopics.length, 3) : 0
  const aNorm = audiencesActive ? curve(sharedAudienceKeys.length, 2) : 0

  const score = Math.round(40 * vNorm + 35 * tNorm + 25 * aNorm)

  return { score, sharedValues, sharedTopics, sharedAudiences }
}

// A short, human "why you match" summary for a card (most salient overlaps).
export function matchReasons(m: MatchResult, limit = 3): string[] {
  return [...m.sharedValues, ...m.sharedAudiences, ...m.sharedTopics].slice(0, limit)
}
