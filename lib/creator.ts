// ============================================================================
// Creator profile — the questionnaire a creator fills out about themselves.
//
// Stored in profiles.creator_profile (JSONB) so the question set can grow
// without migrations. This is the creator analog of lib/brand.ts. It powers the
// creator dashboard's "marketplace profile" preview and, later, the Content
// Marketplace creator card + brand↔creator matching.
//
// The creator's display name and avatar live in the first-class profiles
// columns (full_name, avatar_url), same as the brand form — everything else
// lives in the JSONB blob below.
// ============================================================================

export type CreatorProfile = {
  handle: string
  bio: string
  // Media channels — the creator's handle/username on each network.
  instagram: string
  tiktok: string
  youtube: string
  x: string
  snapchat: string
  // Audience / positioning
  primaryDemographic: string
  contentCategories: string[]
  values: string[]
}

// Payload submitted by the Creator info form: the first-class profile columns
// plus the JSONB creator questionnaire.
export type CreatorFormData = {
  displayName: string
  avatarUrl: string
  creator: CreatorProfile
}

export const EMPTY_CREATOR_PROFILE: CreatorProfile = {
  handle: '',
  bio: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  x: '',
  snapchat: '',
  primaryDemographic: '',
  contentCategories: [],
  values: [],
}

// Coerce an arbitrary JSONB blob into a complete CreatorProfile.
export function parseCreatorProfile(raw: unknown): CreatorProfile {
  const data = (raw ?? {}) as Record<string, unknown>
  const str = (k: keyof CreatorProfile) =>
    typeof data[k] === 'string' ? (data[k] as string) : ''
  const arr = (k: keyof CreatorProfile) =>
    Array.isArray(data[k])
      ? (data[k] as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
  return {
    handle: str('handle'),
    bio: str('bio'),
    instagram: str('instagram'),
    tiktok: str('tiktok'),
    youtube: str('youtube'),
    x: str('x'),
    snapchat: str('snapchat'),
    primaryDemographic: str('primaryDemographic'),
    contentCategories: arr('contentCategories'),
    values: arr('values'),
  }
}

// ---------------------------------------------------------------------------
// Media channels — the single source of truth for the form + previews.
// ---------------------------------------------------------------------------
export const CREATOR_CHANNELS = [
  { key: 'instagram', label: 'Instagram', prefix: '@' },
  { key: 'tiktok', label: 'TikTok', prefix: '@' },
  { key: 'youtube', label: 'YouTube', prefix: '@' },
  { key: 'x', label: 'X', prefix: '@' },
  { key: 'snapchat', label: 'Snapchat', prefix: '@' },
] as const

// Keys of CreatorProfile that hold a media-channel handle.
export type ChannelKey = (typeof CREATOR_CHANNELS)[number]['key']

// ---------------------------------------------------------------------------
// Option sets for the form.
// ---------------------------------------------------------------------------
export const CONTENT_CATEGORIES = [
  'Beauty',
  'Fashion',
  'Fitness',
  'Food',
  'Travel',
  'Lifestyle',
  'Gaming',
  'Tech',
  'Comedy',
  'Education',
  'Music',
  'Art & Design',
  'Parenting',
  'Wellness',
  'Finance',
]

export const CREATOR_DEMOGRAPHICS = [
  'Gen Z (13–24)',
  'Millennials (25–40)',
  'Gen X (41–56)',
  'Boomers (57+)',
  'Parents',
  'Students',
  'Professionals',
]

export const CREATOR_VALUES = [
  'Authenticity',
  'Sustainability',
  'Inclusivity',
  'Community',
  'Creativity',
  'Wellness',
  'Education',
  'Entertainment',
  'Quality',
  'Transparency',
]

// ---------------------------------------------------------------------------
// Completeness — drives the Profile hub's progress indicator (mirrors
// brandCompleteness). Media channels count as a single "add a channel" field.
// ---------------------------------------------------------------------------
export function creatorCompleteness(p: CreatorProfile): number {
  const hasChannel = [p.instagram, p.tiktok, p.youtube, p.x, p.snapchat].some(
    (v) => v.trim().length > 0
  )
  const fields: boolean[] = [
    p.handle.trim().length > 0,
    p.bio.trim().length > 0,
    hasChannel,
    p.primaryDemographic.trim().length > 0,
    p.contentCategories.length > 0,
    p.values.length > 0,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}
