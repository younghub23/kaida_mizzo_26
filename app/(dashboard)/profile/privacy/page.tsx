import { redirect } from 'next/navigation'
import { Download, TriangleAlert } from 'lucide-react'
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
import { IconTile } from '../icon-tile'
import { card, microLabel } from '../ui'

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

      <Card className={`${card} ring-0`}>
        <CardHeader>
          <div className="flex items-center gap-3.5">
            <IconTile
              section="privacy"
              icon={Download}
              className="size-11 rounded-[12px]"
              iconClassName="size-[22px]"
            />
            <div className="flex flex-col gap-1">
              <span className={microLabel}>Your data</span>
              <CardTitle className="text-base">Export Your Data</CardTitle>
              <CardDescription>
                Download a copy of your profile, brand info, and connected accounts
                as JSON.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ExportDataButton />
        </CardContent>
      </Card>

      <Card className={`${card} border-destructive/30 ring-0`}>
        <CardHeader>
          <div className="flex items-center gap-3.5">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-[12px]"
              style={{ background: 'rgba(181,96,74,.12)', color: '#B5604A' }}
            >
              <TriangleAlert className="size-[22px]" strokeWidth={1.7} aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-destructive">
                Danger zone
              </span>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This cannot
                be undone.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  )
}
