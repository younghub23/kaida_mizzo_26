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
} as const

export function canUseSocialListening(plan: PlanTier): boolean {
  return PLAN_FEATURES.socialListening.tiers.includes(plan)
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

// ---------------------------------------------------------------------------
// SOURCE: Stripe subscription tier (mock).
//
// The plan tier is NOT yet persisted on `profiles` or a `subscriptions` table,
// so this returns a single, switchable mock value. Flip MOCK_PLAN below to test
// the gating (e.g. set it to 'pro' to unlock Social Listening). When a real
// subscription record exists, replace the body of getCurrentPlan() with a
// lookup — the call sites won't need to change.
// ---------------------------------------------------------------------------
const MOCK_PLAN: PlanTier = 'starter'

export function getCurrentPlan(): PlanTier {
  return MOCK_PLAN
}
