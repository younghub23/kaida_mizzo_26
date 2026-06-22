// ============================================================================
// Plan tiers + feature gating for the Analytics dashboard.
//
// Gating is centralized here (PLAN_FEATURES + the can* helpers) so it is easy
// to audit and extend to other features later.
// ============================================================================

export type PlanTier = 'starter' | 'growth' | 'pro' | 'agency'

export const PLAN_LABELS: Record<PlanTier, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  agency: 'Agency',
}

/**
 * Central registry of plan-gated features. Each feature lists the tiers that
 * unlock it. Add new gated features here rather than scattering tier checks
 * across the UI.
 */
export const PLAN_FEATURES = {
  // Enterprise-tier analysis: brand-mention monitoring + sentiment.
  socialListening: {
    label: 'Social listening & sentiment',
    tiers: ['pro', 'agency'] as PlanTier[],
  },
} as const

export function canUseSocialListening(plan: PlanTier): boolean {
  return PLAN_FEATURES.socialListening.tiers.includes(plan)
}

// AI assistant is available on Growth, Pro, and Agency (not the free default
// or Starter). Used to gate AI features and brand-context injection.
const AI_TIERS: PlanTier[] = ['growth', 'pro', 'agency']

export function canUseAi(plan: string): boolean {
  return AI_TIERS.includes(plan as PlanTier)
}

// ---------------------------------------------------------------------------
// SOURCE: profiles.plan (real — populated by the Stripe webhook).
//
// `profiles.plan` can be 'free' | 'starter' | 'growth' | 'pro' | 'agency' |
// 'past_due'. Anything that isn't a paid analytics tier (free, past_due, null,
// unknown) maps down to the most restricted tier, 'starter', so gating fails
// closed. Kept PURE — this module is imported by client components, so the DB
// read happens in the server page that calls it.
// ---------------------------------------------------------------------------
export function normalizePlan(value: string | null | undefined): PlanTier {
  if (value === 'growth' || value === 'pro' || value === 'agency') return value
  return 'starter'
}
