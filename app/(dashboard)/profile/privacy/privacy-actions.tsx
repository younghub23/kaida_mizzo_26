'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { deleteAccount } from '@/app/actions/profile'

export function ExportDataButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be signed in to export your data.')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      const { data: socialAccounts } = await supabase
        .from('social_accounts')
        .select('platform, username, created_at')
        .eq('user_id', user.id)

      const payload = {
        exportedAt: new Date().toISOString(),
        account: { id: user.id, email: user.email, createdAt: user.created_at },
        profile,
        socialAccounts,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tala-data-export.json'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Your data export has downloaded.')
    } catch {
      toast.error('Failed to export your data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button className="gap-2" onClick={handleExport} disabled={loading}>
      <Download className="size-4" />
      {loading ? 'Preparing…' : 'Download your data'}
    </Button>
  )
}

export function DeleteAccountButton() {
  const [confirmText, setConfirmText] = useState('')
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount()
      // deleteAccount redirects on success; we only get here on error.
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="size-4" />
          Delete account
        </Button>
      </DialogTrigger>
      <DialogContent className="profile-warm tala-theme">
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently deletes your account and all associated data. This
            action cannot be undone. Type <strong>DELETE</strong> to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmDelete" className="sr-only">
            Type DELETE to confirm
          </Label>
          <Input
            id="confirmDelete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={confirmText !== 'DELETE' || pending}
            onClick={handleDelete}
          >
            {pending ? 'Deleting…' : 'Permanently delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
