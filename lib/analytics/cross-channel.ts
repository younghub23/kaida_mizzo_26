// ============================================================================
// CROSS-CHANNEL FOLLOWER MATCHING
// ----------------------------------------------------------------------------
// Pure, deterministic logic for identifying ONE person who follows you on
// MULTIPLE platforms under slightly different identities — e.g. Instagram
// @jane.eyre and TikTok @jane_eyre, same human, near-identical bio.
//
// There is no shared identity key across networks, so we infer it from three
// fuzzy signals and combine them into a confidence score:
//   • handle  — normalized (dots/underscores/spaces stripped) edit-distance
//   • name    — display-name edit-distance
//   • bio     — Jaccard overlap of meaningful words
//
// Profiles whose combined score clears a threshold are unioned together; any
// resulting group that spans 2+ distinct platforms is a cross-channel person.
//
// No Math.random / Date.now — same input always yields the same grouping, so
// it is safe to run during both server and client render.
// ============================================================================

import type { RealNetwork } from '@/app/(dashboard)/analytics/mock-data'

export type FollowerProfile = {
  platform: RealNetwork
  handle: string // without a leading "@"
  displayName: string
  bio: string
}

export type MatchSignals = {
  handle: number // 0..1
  name: number // 0..1
  bio: number // 0..1
}

export type CrossChannelPerson = {
  id: string
  /** Best display name we have for this person across their accounts. */
  name: string
  accounts: FollowerProfile[]
  platforms: RealNetwork[]
  /** Combined confidence that these accounts are the same person, 0..1. */
  confidence: number
  confidenceLabel: 'High' | 'Medium'
  /** Strongest contributing similarity signal, for an at-a-glance reason. */
  topSignal: keyof MatchSignals
}

// Relative weight of each signal in the combined score (sums to 1).
const WEIGHTS: MatchSignals = { handle: 0.45, name: 0.35, bio: 0.2 }

// A pair of profiles is treated as the same person at/above this score.
const MATCH_THRESHOLD = 0.62
// Groups at/above this average confidence are labelled "High".
const HIGH_CONFIDENCE = 0.8

// Common bio filler that shouldn't drive a match on its own.
const BIO_STOPWORDS = new Set([
  'the', 'and', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'with', 'my', 'i',
  'im', 'me', 'you', 'your', 'is', 'are', 'at', 'by', 'or', 'be', 'we', 'it',
])

// ----------------------------------------------------------------------------
// Normalization
// ----------------------------------------------------------------------------

/** Strip @, separators, and case so "jane.eyre" === "jane_eyre" === "JaneEyre". */
function normalizeHandle(handle: string): string {
  return handle.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9]/g, '')
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Meaningful, de-emoji'd, stopword-free word set from a bio. */
function bioTokens(bio: string): Set<string> {
  const words = bio
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !BIO_STOPWORDS.has(w))
  return new Set(words)
}

// ----------------------------------------------------------------------------
// Similarity primitives
// ----------------------------------------------------------------------------

/** Levenshtein edit distance between two strings. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/** Edit-distance similarity normalized to 0..1 (1 = identical). */
function stringSimilarity(a: string, b: string): number {
  if (!a && !b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - editDistance(a, b) / maxLen
}

/** Jaccard overlap of two word sets, 0..1. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 0
  let intersection = 0
  for (const w of a) if (b.has(w)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** Per-signal similarity between two follower profiles. */
export function profileSignals(a: FollowerProfile, b: FollowerProfile): MatchSignals {
  return {
    handle: stringSimilarity(normalizeHandle(a.handle), normalizeHandle(b.handle)),
    name: stringSimilarity(normalizeName(a.displayName), normalizeName(b.displayName)),
    bio: jaccard(bioTokens(a.bio), bioTokens(b.bio)),
  }
}

function combinedScore(signals: MatchSignals): number {
  return (
    signals.handle * WEIGHTS.handle +
    signals.name * WEIGHTS.name +
    signals.bio * WEIGHTS.bio
  )
}

// ----------------------------------------------------------------------------
// Grouping (union-find over cross-platform matches)
// ----------------------------------------------------------------------------

function topSignal(signals: MatchSignals): keyof MatchSignals {
  const entries = Object.entries(signals) as [keyof MatchSignals, number][]
  return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0]
}

/**
 * Group follower profiles into people that appear on 2+ platforms.
 *
 * Only profiles on DIFFERENT platforms are ever matched (the same person can't
 * follow you twice from one network in this model), and groups are kept only
 * when they span multiple platforms — single-platform followers are dropped.
 */
export function matchCrossChannelFollowers(
  profiles: FollowerProfile[]
): CrossChannelPerson[] {
  const n = profiles.length
  const parent = Array.from({ length: n }, (_, i) => i)

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]] // path compression
      x = parent[x]
    }
    return x
  }
  const union = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb)
  }

  // Compare every cross-platform pair once; union those that clear the bar.
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (profiles[i].platform === profiles[j].platform) continue
      if (combinedScore(profileSignals(profiles[i], profiles[j])) >= MATCH_THRESHOLD) {
        union(i, j)
      }
    }
  }

  // Collect members by group root.
  const groups = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const root = find(i)
    const members = groups.get(root)
    if (members) members.push(i)
    else groups.set(root, [i])
  }

  const people: CrossChannelPerson[] = []
  for (const members of groups.values()) {
    const accounts = members.map((i) => profiles[i])
    const platforms = [...new Set(accounts.map((a) => a.platform))]
    if (platforms.length < 2) continue // not cross-channel

    // Confidence = average combined score over the group's cross-platform pairs.
    let sum = 0
    let count = 0
    const agg: MatchSignals = { handle: 0, name: 0, bio: 0 }
    for (let i = 0; i < accounts.length; i++) {
      for (let j = i + 1; j < accounts.length; j++) {
        if (accounts[i].platform === accounts[j].platform) continue
        const s = profileSignals(accounts[i], accounts[j])
        sum += combinedScore(s)
        agg.handle += s.handle
        agg.name += s.name
        agg.bio += s.bio
        count++
      }
    }
    const confidence = count ? sum / count : 0
    if (count) {
      agg.handle /= count
      agg.name /= count
      agg.bio /= count
    }

    people.push({
      id: accounts.map((a) => `${a.platform}:${a.handle}`).sort().join('|'),
      // Prefer the longest display name as the canonical one.
      name: accounts.reduce((best, a) =>
        a.displayName.length > best.length ? a.displayName : best, accounts[0].displayName),
      accounts: [...accounts].sort((a, b) => a.platform.localeCompare(b.platform)),
      platforms: platforms.sort(),
      confidence,
      confidenceLabel: confidence >= HIGH_CONFIDENCE ? 'High' : 'Medium',
      topSignal: topSignal(agg),
    })
  }

  // Most platforms first, then highest confidence — most interesting at the top.
  return people.sort(
    (a, b) => b.platforms.length - a.platforms.length || b.confidence - a.confidence
  )
}
