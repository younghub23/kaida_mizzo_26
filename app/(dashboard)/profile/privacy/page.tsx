import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { ExportDataButton, DeleteAccountButton } from './privacy-actions'
import { PageHeading } from '../page-heading'
import { microLabel } from '../ui'

export default async function PrivacyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Data & Privacy"
        subtitle="Control your data and your account."
      />

      <Card>
        <CardHeader>
          <span className={microLabel}>Your data</span>
          <CardTitle className="text-base">Export Your Data</CardTitle>
          <CardDescription>
            Download a copy of your profile, brand info, and connected accounts
            as JSON.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportDataButton />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-destructive">
            Danger
          </span>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot
            be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  )
}
