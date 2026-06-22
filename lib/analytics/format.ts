// Small presentation helpers for analytics numbers. Pure + deterministic so
// they are safe to call during both server and client render.

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return `${value}`
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`
}

export function formatDelta(deltaPct: number): string {
  const sign = deltaPct > 0 ? '+' : ''
  return `${sign}${deltaPct.toFixed(1)}%`
}

/**
 * Where a section's data came from this load. Drives the source badge.
 * `empty` = production with no connected source (no mock shown).
 */
export type SectionSource = 'live' | 'mock' | 'mixed' | 'empty'

export function sourceSuffix(source: SectionSource): string {
  if (source === 'live') return '(live)'
  if (source === 'mixed') return '(live + mock)'
  if (source === 'empty') return '(not connected)'
  return '(mock)'
}
