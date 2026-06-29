// ============================================================================
// Shared social-platform metadata for the Socials hub + inline composer.
//
// `dedicated: true` platforms render a hand-built, pixel-accurate feed preview
// (Instagram/X/LinkedIn). Others fall back to the generic preview.
// ============================================================================

export type PlatformId =
  | 'instagram'
  | 'x'
  | 'linkedin'
  | 'facebook'
  | 'tiktok'
  | 'google'

export type PlatformMeta = {
  id: PlatformId
  label: string
  color: string
  /** Soft gradient used behind the logo tile on the hub. */
  gradient: string
  /** Single text field char limit for the composer (null = generous/none). */
  charLimit: number | null
  dedicated: boolean
  /** Whether this channel can be posted to from the Socials hub. Google is
   *  connected for Analytics only, not posting. */
  postable: boolean
}

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    gradient: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)',
    charLimit: 2200,
    dedicated: true,
    postable: true,
  },
  x: {
    id: 'x',
    label: 'X',
    color: '#000000',
    gradient: 'linear-gradient(135deg,#1a1a1a,#000000)',
    charLimit: 280,
    dedicated: true,
    postable: true,
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    gradient: 'linear-gradient(135deg,#0a66c2,#004182)',
    charLimit: 3000,
    dedicated: true,
    postable: true,
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    gradient: 'linear-gradient(135deg,#1877F2,#0a4bc2)',
    charLimit: null,
    dedicated: false,
    postable: true,
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    color: '#000000',
    gradient: 'linear-gradient(135deg,#25F4EE,#000000,#FE2C55)',
    charLimit: 2200,
    dedicated: false,
    postable: true,
  },
  google: {
    id: 'google',
    label: 'Google',
    color: '#4285F4',
    gradient: 'linear-gradient(135deg,#4285F4,#34A853)',
    charLimit: null,
    dedicated: false,
    postable: false,
  },
}

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[]

export function isPlatformId(value: string): value is PlatformId {
  return value in PLATFORMS
}

// Posting timezones offered in the scheduler (matches the design's
// EST / PST / PHT / other).
export const TIMEZONES = [
  { value: 'America/New_York', label: 'EST — Eastern' },
  { value: 'America/Los_Angeles', label: 'PST — Pacific' },
  { value: 'Asia/Manila', label: 'PHT — Philippines' },
  { value: 'UTC', label: 'UTC' },
] as const
