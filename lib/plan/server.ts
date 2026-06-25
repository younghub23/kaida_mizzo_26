// ============================================================================
// Live plan resolution — reads the user's real subscription tier.
//
// SOURCE OF TRUTH: profiles.plan, which the Stripe webhook
// (app/api/webhooks/stripe) keeps in sync on checkout / subscription /
// invoice events. There is no mock here — every gate reflects what the user
// actually pays for.
//
// This module is SERVER-ONLY (it reads Supabase via cookies). Keep it out of
// lib/analytics/plan.ts, which is imported by client components.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlanTier, type PlanTier } from '@/lib/analytics/plan'

// The lowest paid tier is the safe floor for billing states ('free',
// 'past_due', null): those unlock nothing gated, and 'starter' itself unlocks
// nothing gated, so this never over-grants access.
const FLOOR: PlanTier = 'starter'

/**
 * The current signed-in user's plan tier, resolved from their Stripe-backed
 * subscription. Returns 'starter' as the floor when unauthenticated or on a
 * non-paying billing state.
 */
export async function getCurrentPlan(): Promise<PlanTier> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return FLOOR

  const { data } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  return isPlanTier(data?.plan) ? data.plan : FLOOR
}

/**
 * Resolve an arbitrary user's plan by id, using the service-role client.
 * Used by server-to-server paths (e.g. the public ingestion endpoint) where
 * there is no session cookie.
 */
export async function getPlanForUser(userId: string): Promise<PlanTier> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  return isPlanTier(data?.plan) ? data.plan : FLOOR
}
