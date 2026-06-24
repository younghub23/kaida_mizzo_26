// ============================================================================
// CROSS-CHANNEL FOLLOWER MATCHING — pure, deterministic identity inference
// ----------------------------------------------------------------------------
// Finds people who follow the brand on MORE THAN ONE network under slightly
// different identities (e.g. Instagram @jane.eyre and TikTok @jane_eyre are very
// likely the same person). These are POTENTIAL matches inferred from public
// profile signals — never confirmed identities — so every result carries a
// confidence score the UI surfaces honestly.
//
// HOW IT WORKS
//   For every pair of profiles on DIFFERENT platforms we combine three fuzzy
//   signals into a single 0..1 score:
//     • handle  — normalize (strip @ . _ - / case) then Levenshtein similarity
//     • name    — Levenshtein similarity on the normalized display name
//     • bio     — Jaccard overlap of meaningful words (emoji/punctuation/
//                 stopwords dropped)
//   Pairs scoring above MATCH_THRESHOLD become edges; union-find groups the
//   connected profiles; only groups spanning 2+ distinct platforms are kept.
//
// DETERMINISM
//   No Math.random() / Date.now(): given the same rosters this produces byte-
//   identical output, so it is safe to run during server render and re-render
//   on the client without a hydration mismatch. (See the determinism note in
//   app/(dashboard)/analytics/mock-data.ts.)
// ============================================================================

import type { RealNetwork } from '@/app/(dashboard)/analytics/mock-data'

// ----------------------------------------------------------------------------
// Public types
// ----------------------------------------------------------------------------

/** One follower as a provider's roster exposes it (handle + name + bio). */
export type FollowerProfile = {
  /** Public @handle (with or without the leading @). */
  handle: string
  /** Display name. */
  name: string
  /** Profile bio / description. May be empty. */
  bio: string
}

/** A single platform's follower roster, as collected in loadAnalytics(). */
export type NetworkRoster = {
  platform: RealNetwork
  followers: FollowerProfile[]
}

/** Which of the three signals contributed most to a match. */
export type MatchSignal = 'handle' | 'name' | 'bio'

/** Human-readable confidence band shown alongside the numeric score. */
export type ConfidenceLabel = 'High' | 'Medium' | 'Low'

/** One of a matched person's per-platform accounts. */
export type MatchedAccount = {
  platform: RealNetwork
  handle: string
  name: string
  bio: string
}

/** A person we believe follows the brand on 2+ networks. */
export type MatchedPerson = {
  /** Stable id derived from the member identities (safe as a React key). */
  id: string
  /** Best display name across the linked accounts. */
  canonicalName: string
  /** Every linked account, one per platform identity. */
  accounts: MatchedAccount[]
  /** Distinct platforms this person follows the brand on. */
  platforms: RealNetwork[]
  /** Match confidence, 0..1 (rounded). NOT a confirmed identity. */
  confidence: number
  /** Confidence band derived from `confidence`. */
  confidenceLabel: ConfidenceLabel
  /** The signal that contributed most to the match (drives the "reason" copy). */
  strongestSignal: MatchSignal
}

// ----------------------------------------------------------------------------
// Tunables — how the three signals combine and where the bar sits.
// ----------------------------------------------------------------------------

/** Relative weight of each signal in the blended score (sums to 1.0). */
const WEIGHTS: Record<MatchSignal, number> = { handle: 0.45, name: 0.35, bio: 0.2 }

/** A pair must score at least this to be considered the same person. */
const MATCH_THRESHOLD = 0.7

/** Score at/above which we label a match "High" confidence. */
const HIGH_CONFIDENCE = 0.85

/**
 * Short, high-frequency words carry no identifying signal in a bio, so we drop
 * them before computing word overlap. (Words of length ≤ 2 are dropped too.)
 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'you', 'our', 'are', 'was', 'this',
  'that', 'from', 'has', 'have', 'all', 'who', 'her', 'his', 'their', 'them',
  'out', 'get', 'one', 'via', 'about', 'into', 'over', 'than', 'then',
])

// ----------------------------------------------------------------------------
// Normalization — exported so callers/tests can reason about the inputs.
// ----------------------------------------------------------------------------

/** Lowercase, drop the @, separators (. _ - space) and any non-alphanumerics. */
export function normalizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9]/g, '')
}

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Meaningful bio words: lowercase, no emoji/punctuation/stopwords, length > 2. */
export function bioTokens(bio: string): Set<string> {
  const words = bio
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  return new Set(words)
}

// ----------------------------------------------------------------------------
// Similarity primitives
// ----------------------------------------------------------------------------

/** Levenshtein edit distance (iterative, single-row DP). */
function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

/** Edit-distance similarity in 0..1 (1 = identical). Empty vs empty = 1. */
function stringSimilarity(a: string, b: string): number {
  if (!a && !b) return 1
  if (!a || !b) return 0
  const max = Math.max(a.length, b.length)
  return 1 - editDistance(a, b) / max
}

/** Jaccard overlap of two word sets in 0..1. No shared words / empty = 0. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const w of a) if (b.has(w)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

// ----------------------------------------------------------------------------
// Pairwise scoring
// ----------------------------------------------------------------------------

/** A roster profile with its normalized fields precomputed once. */
type Entry = {
  platform: RealNetwork
  profile: FollowerProfile
  handle: string
  name: string
  tokens: Set<string>
}

type PairScore = {
  /** Blended 0..1 score. */
  score: number
  /** Weighted contribution of each signal (used to pick the strongest). */
  contributions: Record<MatchSignal, number>
}

/**
 * Score two profiles. When neither bio carries meaningful words we renormalize
 * the handle/name weights so a missing bio neither helps nor unfairly hurts the
 * score (rather than dragging it toward zero).
 */
function scorePair(x: Entry, y: Entry): PairScore {
  const handleSim = stringSimilarity(x.handle, y.handle)
  const nameSim = stringSimilarity(x.name, y.name)

  const bioInformative = x.tokens.size > 0 && y.tokens.size > 0
  const bioSim = bioInformative ? jaccard(x.tokens, y.tokens) : 0

  let contributions: Record<MatchSignal, number>
  if (bioInformative) {
    contributions = {
      handle: handleSim * WEIGHTS.handle,
      name: nameSim * WEIGHTS.name,
      bio: bioSim * WEIGHTS.bio,
    }
  } else {
    // Renormalize handle + name to fill the dropped bio weight.
    const span = WEIGHTS.handle + WEIGHTS.name
    contributions = {
      handle: (handleSim * WEIGHTS.handle) / span,
      name: (nameSim * WEIGHTS.name) / span,
      bio: 0,
    }
  }

  const score = contributions.handle + contributions.name + contributions.bio
  return { score, contributions }
}

// ----------------------------------------------------------------------------
// Union-find (disjoint set) over the flattened roster
// ----------------------------------------------------------------------------

class UnionFind {
  private parent: number[]
  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i)
  }
  find(i: number): number {
    while (this.parent[i] !== i) {
      this.parent[i] = this.parent[this.parent[i]] // path compression
      i = this.parent[i]
    }
    return i
  }
  union(a: number, b: number): void {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) this.parent[Math.max(ra, rb)] = Math.min(ra, rb)
  }
}

// ----------------------------------------------------------------------------
// Helpers for assembling a group into a MatchedPerson
// ----------------------------------------------------------------------------

function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= HIGH_CONFIDENCE) return 'High'
  if (score >= MATCH_THRESHOLD) return 'Medium'
  return 'Low'
}

/** Count of alphabetic characters — proxy for "most complete" display name. */
function letterCount(s: string): number {
  return (s.match(/[a-z]/gi) ?? []).length
}

/**
 * Pick the canonical display name: the most complete (most letters), breaking
 * ties by longer string then lexicographically — fully deterministic.
 */
function canonicalName(entries: Entry[]): string {
  return entries
    .map((e) => e.profile.name)
    .reduce((best, name) => {
      const bl = letterCount(best)
      const nl = letterCount(name)
      if (nl > bl) return name
      if (nl < bl) return best
      if (name.length !== best.length) return name.length > best.length ? name : best
      return name < best ? name : best
    })
}

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

/**
 * Group follower rosters from multiple platforms into likely-same people who
 * appear on 2+ distinct platforms. Pure and deterministic. Sorted by number of
 * platforms (desc), then confidence (desc), then canonical name.
 */
export function matchCrossChannelFollowers(rosters: NetworkRoster[]): MatchedPerson[] {
  // 1. Flatten to a single indexed list with normalized fields precomputed.
  const entries: Entry[] = []
  for (const roster of rosters) {
    for (const profile of roster.followers) {
      entries.push({
        platform: roster.platform,
        profile,
        handle: normalizeHandle(profile.handle),
        name: normalizeName(profile.name),
        tokens: bioTokens(profile.bio),
      })
    }
  }

  // 2. Score every cross-platform pair; qualifying pairs become edges.
  const uf = new UnionFind(entries.length)
  type Edge = { a: number; b: number; score: number; contributions: Record<MatchSignal, number> }
  const edges: Edge[] = []
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      // Same identity can only span DIFFERENT platforms.
      if (entries[i].platform === entries[j].platform) continue
      const { score, contributions } = scorePair(entries[i], entries[j])
      if (score >= MATCH_THRESHOLD) {
        edges.push({ a: i, b: j, score, contributions })
        uf.union(i, j)
      }
    }
  }

  // 3. Bucket entries by their union-find root.
  const groups = new Map<number, number[]>()
  for (let i = 0; i < entries.length; i++) {
    const root = uf.find(i)
    const bucket = groups.get(root)
    if (bucket) bucket.push(i)
    else groups.set(root, [i])
  }

  // 4. Build a MatchedPerson for each group spanning 2+ distinct platforms.
  const people: MatchedPerson[] = []
  for (const memberIdx of groups.values()) {
    if (memberIdx.length < 2) continue

    const memberSet = new Set(memberIdx)
    const platforms = Array.from(new Set(memberIdx.map((i) => entries[i].platform)))
    if (platforms.length < 2) continue // must cross networks

    // Edges fully inside this group drive its confidence and strongest signal.
    const groupEdges = edges.filter((e) => memberSet.has(e.a) && memberSet.has(e.b))
    const avgScore = groupEdges.reduce((s, e) => s + e.score, 0) / groupEdges.length

    const totals: Record<MatchSignal, number> = { handle: 0, name: 0, bio: 0 }
    for (const e of groupEdges) {
      totals.handle += e.contributions.handle
      totals.name += e.contributions.name
      totals.bio += e.contributions.bio
    }
    const strongestSignal = (Object.keys(totals) as MatchSignal[]).reduce((best, sig) =>
      totals[sig] > totals[best] ? sig : best
    )

    const members = memberIdx.map((i) => entries[i])
    const accounts: MatchedAccount[] = members.map((e) => ({
      platform: e.platform,
      handle: e.profile.handle,
      name: e.profile.name,
      bio: e.profile.bio,
    }))
    const confidence = Math.round(avgScore * 10000) / 10000

    people.push({
      id: members
        .map((e) => `${e.platform}:${e.handle}`)
        .sort()
        .join('+'),
      canonicalName: canonicalName(members),
      accounts,
      platforms,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      strongestSignal,
    })
  }

  // 5. Rank: more platforms first, then higher confidence, then name (stable).
  people.sort(
    (a, b) =>
      b.platforms.length - a.platforms.length ||
      b.confidence - a.confidence ||
      a.canonicalName.localeCompare(b.canonicalName)
  )

  return people
}
