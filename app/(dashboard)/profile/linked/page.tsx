import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LinkedAccounts, type ConnectedAccount } from './linked-accounts'
import { PageHeading } from '../page-heading'
import { microLabel } from '../ui'

const PROVIDER_LABELS: Record<string, string> = {
  email: 'Email & password',
  google: 'Google',
}

export default async function LinkedAccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('platform, username')
    .eq('user_id', user.id)

  const connected: ConnectedAccount[] = (accounts ?? []).map((a) => ({
    platform: a.platform,
    username: a.username,
  }))

  const providers = Array.from(
    new Set((user.identities ?? []).map((i) => i.provider))
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Linked Accounts"
        subtitle="Social profiles and sign-in methods connected to Tala."
      />

      <Card>
        <CardHeader>
          <span className={microLabel}>Channels</span>
          <CardTitle className="text-base">Social Accounts</CardTitle>
          <CardDescription>
            Connect channels to schedule and publish from Tala.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkedAccounts connected={connected} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <span className={microLabel}>Access</span>
          <CardTitle className="text-base">Sign-In Methods</CardTitle>
          <CardDescription>How you sign in to your Tala account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {providers.map((provider) => (
            <div key={provider} className="flex items-center gap-4 py-3">
              <Mail className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {PROVIDER_LABELS[provider] ?? provider}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
