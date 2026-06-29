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
  /** Brand gradient used behind the logo glyph on the hub + composer header. */
  gradient: string
  /** Brand color used for the selected-tile ring + the preview-card avatar. */
  ring: string
  /** Human label for what a post is on this channel ("Feed post", "Update"…). */
  postType: string
  /** DM-Serif footnote shown under the live preview, per channel. */
  previewFootnote: string
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
    gradient:
      'radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%)',
    ring: '#d6249f',
    postType: 'Feed post',
    previewFootnote: 'Instagram feed · square crop',
    charLimit: 2200,
    dedicated: true,
    postable: true,
  },
  x: {
    id: 'x',
    label: 'X',
    color: '#000000',
    gradient: 'linear-gradient(135deg,#1a1a1a,#000000)',
    ring: '#1a1a1a',
    postType: 'Post',
    previewFootnote: 'X · timeline post',
    charLimit: 280,
    dedicated: true,
    postable: true,
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    gradient: 'linear-gradient(135deg,#0A66C2,#004182)',
    ring: '#0A66C2',
    postType: 'Update',
    previewFootnote: 'LinkedIn update · professional tone',
    charLimit: 3000,
    dedicated: true,
    postable: true,
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    gradient: 'linear-gradient(135deg,#18ACFE,#0866FF)',
    ring: '#0866FF',
    postType: 'Feed post',
    previewFootnote: 'Facebook feed · link + image',
    charLimit: null,
    dedicated: true,
    postable: true,
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    color: '#000000',
    gradient: 'linear-gradient(135deg,#25F4EE 0%,#111 42%,#111 58%,#FE2C55 100%)',
    ring: '#FE2C55',
    postType: 'Video',
    previewFootnote: 'TikTok · 9:16 video',
    charLimit: 2200,
    dedicated: true,
    postable: true,
  },
  google: {
    id: 'google',
    label: 'Google',
    color: '#4285F4',
    gradient: 'linear-gradient(135deg,#4285F4,#34A853)',
    ring: '#4285F4',
    postType: 'Post',
    previewFootnote: 'Google Business · profile post',
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
