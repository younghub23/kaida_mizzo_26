import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { AnalyticsDashboard } from './analytics-dashboard'
import { loadAnalytics } from '@/lib/analytics/load'
import { canUseSocialListening, PLAN_LABELS } from '@/lib/analytics/plan'
import { getCurrentPlan } from '@/lib/plan/server'

export default async function AnalyticsPage() {
  // Mirror the other dashboard pages: server-side auth guard.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Live subscription tier from profiles.plan — see lib/plan/server.ts.
  const plan = await getCurrentPlan()
  const socialListeningUnlocked = canUseSocialListening(plan)

  // Live-where-connected, mock-otherwise. Reads social_accounts tokens.
  const data = await loadAnalytics()

  return (
    <div className="tala-theme analytics-page min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-8 pb-14 pt-8">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-fredoka text-[34px] font-semibold leading-[1.05] tracking-[-0.01em]">
              Analytics
            </h1>
            <p className="mt-1.5 font-dm-serif text-lg italic text-muted-foreground">
              Unified performance across all your connected channels.
            </p>
          </div>
          {/* Plan-gate pill → warm email/lemon tint from the category palette. */}
          <Badge
            variant="secondary"
            className="border-transparent"
            style={{ background: '#FBF0D2', color: '#9A6E16' }}
          >
            {PLAN_LABELS[plan]} plan
          </Badge>
        </div>

        <AnalyticsDashboard data={data} socialListeningUnlocked={socialListeningUnlocked} />
      </div>
    </div>
  )
}
