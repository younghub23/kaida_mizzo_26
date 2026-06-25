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
  // AI Data Analyst chat role: competitor intelligence + inspiration.
  aiDataAnalyst: {
    label: 'AI Data Analyst',
    tiers: ['pro', 'agency'] as PlanTier[],
  },
  // Automatic email-list sync from the user's external website (ingestion API
  // + connect wizard). Lower tiers get manual contact entry only.
  websiteSync: {
    label: 'Website email sync',
    tiers: ['pro', 'agency'] as PlanTier[],
  },
} as const

export function canUseSocialListening(plan: PlanTier): boolean {
  return PLAN_FEATURES.socialListening.tiers.includes(plan)
}

// Automatic website -> email-list sync is Pro/Agency only. Starter & Growth
// get manual contact entry instead.
export function canUseWebsiteSync(plan: string): boolean {
  return PLAN_FEATURES.websiteSync.tiers.includes(plan as PlanTier)
}

// AI assistant is available on Growth, Pro, and Agency (not the free default
// or Starter). Used to gate AI features and brand-context injection.
// This is the gate for the AI Content Strategist role.
const AI_TIERS: PlanTier[] = ['growth', 'pro', 'agency']

export function canUseAi(plan: string): boolean {
  return AI_TIERS.includes(plan as PlanTier)
}

// The AI Content Strategist role is available wherever AI is (Growth+).
export function canUseContentStrategist(plan: string): boolean {
  return canUseAi(plan)
}

// The AI Data Analyst role is Pro/Agency only — same gate as Social Listening.
export function canUseDataAnalyst(plan: string): boolean {
  return PLAN_FEATURES.aiDataAnalyst.tiers.includes(plan as PlanTier)
}

// The set of real, paying tiers. The Stripe webhook may also write the billing
// states 'free' / 'past_due' onto profiles.plan; those are not feature tiers
// and unlock nothing gated.
export const PAID_TIERS: readonly PlanTier[] = ['starter', 'growth', 'pro', 'agency']

export function isPlanTier(value: string | null | undefined): value is PlanTier {
  return !!value && PAID_TIERS.includes(value as PlanTier)
}

// NOTE: the live tier lookup (reads profiles.plan, which the Stripe webhook
// keeps in sync) lives in lib/plan/server.ts — it is server-only and must not
// be imported here, since this module is also pulled into client components.
