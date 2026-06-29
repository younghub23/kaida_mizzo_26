'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOutEverywhere } from '@/app/actions/profile'

export function SignOutEverywhere() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      className="gap-2 hover:border-[rgba(200,71,46,.35)] hover:bg-[rgba(200,71,46,.07)] hover:text-[#C8472E]"
      disabled={pending}
      onClick={() => startTransition(() => signOutEverywhere())}
    >
      <LogOut className="size-4" />
      {pending ? 'Signing out…' : 'Sign out of all devices'}
    </Button>
  )
}
