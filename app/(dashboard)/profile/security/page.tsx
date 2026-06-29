import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Mail,
  KeyRound,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SignOutEverywhere } from './sign-out-everywhere'
import { PageHeading } from '../page-heading'

function formatDateTime(value: string | undefined) {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default async function SecurityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const emailVerified = Boolean(user.email_confirmed_at)

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Security & Sign-In"
        subtitle="Keep your account secure and manage how you sign in."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How You Sign In to Tala</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          <div className="flex items-center gap-4 py-3">
            <Mail className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Email</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant={emailVerified ? 'secondary' : 'destructive'}>
              {emailVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>

          <Link
            href="/profile/password"
            className="flex items-center gap-4 py-3 transition-colors hover:bg-muted/50"
          >
            <KeyRound className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">Change your password</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>

          <div className="flex items-center gap-4 py-3">
            <Clock className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Last sign-in</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(user.last_sign_in_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" />
            2-Step Verification
            <Badge variant="outline">Coming soon</Badge>
          </CardTitle>
          <CardDescription>
            Add an extra layer of security by requiring a second step when you
            sign in. We&apos;ll let you know when this is available.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Sessions</CardTitle>
          <CardDescription>
            Signed out somewhere you don&apos;t recognize? Sign out of every
            device to be safe — you&apos;ll need to sign in again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutEverywhere />
        </CardContent>
      </Card>
    </div>
  )
}
