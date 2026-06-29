import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PasswordForm } from './password-form'
import { PageHeading } from '../page-heading'

export default async function PasswordPage() {
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
        title="Tala Password"
        subtitle="The password you use to sign in to Tala."
      />
      <PasswordForm />
    </div>
  )
}
