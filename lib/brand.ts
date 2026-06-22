// ============================================================================
// Brand profile — the questionnaire a business fills out about itself.
//
// Stored in profiles.brand_profile (JSONB) so the question set can grow without
// migrations. Two consumers:
//   1. AI assistant context (Growth/Pro/Agency) — see buildBrandContext().
//   2. The future content marketplace brand card.
// ============================================================================

export type BrandProfile = {
  tagline: string
  description: string
  website: string
  brandType: string
  foundedYear: string
  teamSize: string
  // Audience / demographics
  targetAgeRanges: string[]
  targetGenders: string[]
  targetLocations: string
  targetInterests: string
  // Positioning
  brandVoice: string[]
  brandValues: string[]
  primaryGoals: string[]
  contentTopics: string[]
  preferredPlatforms: string[]
  competitors: string
  uniqueSellingPoint: string
  brandColors: string
}

// Payload submitted by the Brand info form: the first-class profile columns
// plus the JSONB brand questionnaire.
export type BrandFormData = {
  businessName: string
  industry: string
  avatarUrl: string
  brand: BrandProfile
}

export const EMPTY_BRAND_PROFILE: BrandProfile = {
  tagline: '',
  description: '',
  website: '',
  brandType: '',
  foundedYear: '',
  teamSize: '',
  targetAgeRanges: [],
  targetGenders: [],
  targetLocations: '',
  targetInterests: '',
  brandVoice: [],
  brandValues: [],
  primaryGoals: [],
  contentTopics: [],
  preferredPlatforms: [],
  competitors: '',
  uniqueSellingPoint: '',
  brandColors: '',
}

// Coerce an arbitrary JSONB blob into a complete BrandProfile.
export function parseBrandProfile(raw: unknown): BrandProfile {
  const data = (raw ?? {}) as Record<string, unknown>
  const str = (k: keyof BrandProfile) =>
    typeof data[k] === 'string' ? (data[k] as string) : ''
  const arr = (k: keyof BrandProfile) =>
    Array.isArray(data[k]) ? (data[k] as unknown[]).filter((v): v is string => typeof v === 'string') : []
  return {
    tagline: str('tagline'),
    description: str('description'),
    website: str('website'),
    brandType: str('brandType'),
    foundedYear: str('foundedYear'),
    teamSize: str('teamSize'),
    targetAgeRanges: arr('targetAgeRanges'),
    targetGenders: arr('targetGenders'),
    targetLocations: str('targetLocations'),
    targetInterests: str('targetInterests'),
    brandVoice: arr('brandVoice'),
    brandValues: arr('brandValues'),
    primaryGoals: arr('primaryGoals'),
    contentTopics: arr('contentTopics'),
    preferredPlatforms: arr('preferredPlatforms'),
    competitors: str('competitors'),
    uniqueSellingPoint: str('uniqueSellingPoint'),
    brandColors: str('brandColors'),
  }
}

// ---------------------------------------------------------------------------
// Option sets for the form (single source of truth).
// ---------------------------------------------------------------------------
export const BRAND_TYPES = [
  'Product / E-commerce',
  'Service business',
  'SaaS / Tech',
  'Local business',
  'Restaurant / Food',
  'Creator / Influencer',
  'Nonprofit',
  'Agency',
  'Other',
]

export const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+']

export const AGE_RANGES = ['13–17', '18–24', '25–34', '35–44', '45–54', '55–64', '65+']

export const GENDERS = ['Women', 'Men', 'Non-binary', 'All genders']

export const BRAND_VOICES = [
  'Playful',
  'Professional',
  'Warm',
  'Bold',
  'Minimal',
  'Luxurious',
  'Witty',
  'Inspirational',
  'Down-to-earth',
]

export const BRAND_VALUES = [
  'Sustainability',
  'Quality',
  'Affordability',
  'Innovation',
  'Community',
  'Inclusivity',
  'Craftsmanship',
  'Transparency',
  'Wellness',
]

export const PRIMARY_GOALS = [
  'Grow followers',
  'Drive sales',
  'Build community',
  'Increase brand awareness',
  'Generate leads',
  'Drive website traffic',
  'Boost engagement',
]

export const PLATFORMS = [
  'Instagram',
  'Facebook',
  'TikTok',
  'LinkedIn',
  'Pinterest',
  'YouTube',
  'X / Twitter',
  'Email',
]

// ---------------------------------------------------------------------------
// Completeness — drives the Home overview progress indicator.
// ---------------------------------------------------------------------------
export function brandCompleteness(p: BrandProfile): number {
  const fields: (string | string[])[] = [
    p.tagline,
    p.description,
    p.website,
    p.brandType,
    p.teamSize,
    p.targetAgeRanges,
    p.targetGenders,
    p.targetLocations,
    p.brandVoice,
    p.brandValues,
    p.primaryGoals,
    p.contentTopics,
    p.preferredPlatforms,
    p.uniqueSellingPoint,
  ]
  const filled = fields.filter((f) =>
    Array.isArray(f) ? f.length > 0 : f.trim().length > 0
  ).length
  return Math.round((filled / fields.length) * 100)
}

// ---------------------------------------------------------------------------
// AI context — flattened, human-readable summary fed to the assistant.
// Call only when the plan allows AI (see canUseAi).
// ---------------------------------------------------------------------------
export function buildBrandContext(
  businessName: string,
  industry: string,
  p: BrandProfile
): string {
  const lines: string[] = []
  if (businessName) lines.push(`Business name: ${businessName}`)
  if (industry) lines.push(`Industry: ${industry}`)
  if (p.brandType) lines.push(`Brand type: ${p.brandType}`)
  if (p.tagline) lines.push(`Tagline: ${p.tagline}`)
  if (p.description) lines.push(`About: ${p.description}`)
  if (p.uniqueSellingPoint) lines.push(`Unique selling point: ${p.uniqueSellingPoint}`)
  if (p.brandValues.length) lines.push(`Values: ${p.brandValues.join(', ')}`)
  if (p.brandVoice.length) lines.push(`Voice: ${p.brandVoice.join(', ')}`)
  const audience = [
    p.targetAgeRanges.length ? `ages ${p.targetAgeRanges.join(', ')}` : '',
    p.targetGenders.length ? p.targetGenders.join(', ') : '',
    p.targetLocations ? `in ${p.targetLocations}` : '',
    p.targetInterests ? `interested in ${p.targetInterests}` : '',
  ].filter(Boolean)
  if (audience.length) lines.push(`Audience: ${audience.join('; ')}`)
  if (p.primaryGoals.length) lines.push(`Goals: ${p.primaryGoals.join(', ')}`)
  if (p.contentTopics.length) lines.push(`Content topics: ${p.contentTopics.join(', ')}`)
  if (p.preferredPlatforms.length) lines.push(`Platforms: ${p.preferredPlatforms.join(', ')}`)
  if (p.competitors) lines.push(`Competitors: ${p.competitors}`)
  return lines.join('\n')
}
