import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getConnectedAccounts } from '@/lib/socials/accounts'
import { getContacts } from '@/app/actions/email'
import { getCurrentPlan } from '@/lib/plan/server'
import { canUseWebsiteSync } from '@/lib/analytics/plan'
import { PLATFORMS, platformHref } from '@/lib/socials/platforms'
import { BrandLogo } from '@/components/socials/brand-logo'
import { EmailsSection } from '@/components/socials/emails-section'

export default async function SocialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [accounts, plan, contacts] = await Promise.all([
    getConnectedAccounts(),
    getCurrentPlan(),
    getContacts(),
  ])

  const canSync = canUseWebsiteSync(plan)
  const sources = Array.from(new Set(contacts.map((c) => c.source))).filter(Boolean)

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Socials</h1>
          <p className="text-sm text-muted-foreground">
            Pick a channel to create a post, or manage your email campaigns below.
          </p>
        </div>
        <Link href="/socials/connect">
          <Button variant="outline" className="gap-2">
            <Link2 className="size-4" />
            Connect Accounts
          </Button>
        </Link>
      </div>

      {/* connected channels */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Your channels</h2>
        {accounts.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-8">
            <p className="text-sm text-muted-foreground">
              You haven’t connected any social accounts yet. Connect one to start posting.
            </p>
            <Link href="/socials/connect">
              <Button className="gap-2">
                <Link2 className="size-4" />
                Connect Accounts
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-5">
            {accounts.map((account) => {
              const meta = PLATFORMS[account.platform]
              return (
                <Link
                  key={account.platform}
                  href={platformHref(account.platform)}
                  className="group flex w-28 flex-col items-center gap-2"
                >
                  <span
                    className="flex size-20 items-center justify-center rounded-2xl p-5 text-white shadow-sm transition-transform group-hover:scale-105"
                    style={{ background: meta.gradient }}
                  >
                    <BrandLogo id={account.platform} />
                  </span>
                  <span className="text-sm font-medium">{meta.label}</span>
                  {account.username && (
                    <span className="-mt-1.5 truncate text-xs text-muted-foreground">
                      @{account.username}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* emails */}
      <EmailsSection canSync={canSync} contactCount={contacts.length} sources={sources} />
    </div>
  )
}
