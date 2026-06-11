'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { updateProfile, type ProfileState } from '@/app/actions/profile'
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

const INDUSTRIES = [
  'Retail',
  'Restaurant',
  'Healthcare',
  'Fitness',
  'Beauty',
  'Real Estate',
  'Tech',
  'Other',
]

const initialState: ProfileState = { error: null, success: false }

export function ProfileForm({
  fullName,
  avatarUrl,
  industry,
}: {
  fullName: string
  avatarUrl: string
  industry: string
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState)
  const [logoUrl, setLogoUrl] = useState(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.success) {
      toast.success('Profile updated')
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload-logo', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (res.ok && data.url) {
      setLogoUrl(data.url)
    } else {
      toast.error(data.error ?? 'Failed to upload logo')
    }

    setUploading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your business profile settings.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Business name</Label>
            <Input id="fullName" name="fullName" defaultValue={fullName} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="industry">Industry</Label>
            <select
              id="industry"
              name="industry"
              defaultValue={industry}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            >
              <option value="" disabled>
                Select an industry
              </option>
              {INDUSTRIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="logo">Logo</Label>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-16 w-16 rounded-lg object-cover ring-1 ring-foreground/10"
              />
            )}
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleLogoChange}
              disabled={uploading}
            />
            <input type="hidden" name="avatarUrl" value={logoUrl} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending || uploading} className="w-full">
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
