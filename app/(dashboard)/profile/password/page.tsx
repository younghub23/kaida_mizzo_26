import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PasswordForm } from './password-form'

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
      <div>
        <h1 className="text-2xl font-semibold">Tala password</h1>
        <p className="text-sm text-muted-foreground">
          The password you use to sign in to Tala.
        </p>
      </div>
      <PasswordForm />
    </div>
  )
}
