import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { AnalyticsDashboard } from './analytics-dashboard'
import { loadAnalytics } from '@/lib/analytics/load'
import { getCurrentPlan, canUseSocialListening, PLAN_LABELS } from '@/lib/analytics/plan'

export default async function AnalyticsPage() {
  // Mirror the other dashboard pages: server-side auth guard.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // SOURCE: subscription tier (mock) — see lib/analytics/plan.ts.
  const plan = getCurrentPlan()
  const socialListeningUnlocked = canUseSocialListening(plan)

  // Live-where-connected, mock-otherwise. Reads social_accounts tokens.
  const data = await loadAnalytics()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Unified performance across all your connected channels.
          </p>
        </div>
        <Badge variant="secondary">{PLAN_LABELS[plan]} plan</Badge>
      </div>

      <AnalyticsDashboard data={data} socialListeningUnlocked={socialListeningUnlocked} />
    </div>
  )
}
