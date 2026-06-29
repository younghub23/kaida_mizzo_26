'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOutEverywhere } from '@/app/actions/profile'

export function SignOutEverywhere() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="destructive"
      className="gap-2"
      disabled={pending}
      onClick={() => startTransition(() => signOutEverywhere())}
    >
      <LogOut className="size-4" />
      {pending ? 'Signing out…' : 'Sign out of all devices'}
    </Button>
  )
}
