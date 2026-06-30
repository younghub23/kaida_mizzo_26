'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { changePassword, type FormState } from '@/app/actions/profile'
import { IconTile } from '../icon-tile'
import { card, microLabel } from '../ui'

const initialState: FormState = { error: null, success: false }

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success('Password updated')
      formRef.current?.reset()
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Card className={`${card} ring-0`}>
      <CardHeader>
        <div className="flex items-center gap-3.5">
          <IconTile
            section="password"
            icon={KeyRound}
            className="size-11 rounded-[12px]"
            iconClassName="size-[22px]"
          />
          <div className="flex flex-col gap-1">
            <span className={microLabel}>Password</span>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>
              Enter your current password, then choose a new one (at least 8
              characters).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form action={formAction} ref={formRef}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? 'Updating…' : 'Update password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
