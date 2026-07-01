'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, IdCard, UserRound, Share2, Compass } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { updateCreatorProfile } from '@/app/actions/profile'
import { PageHeading } from '../page-heading'
import { IconTile } from '../icon-tile'
import { card, microLabel } from '../ui'
import {
  type CreatorProfile,
  type ChannelKey,
  CREATOR_CHANNELS,
  CONTENT_CATEGORIES,
  CREATOR_DEMOGRAPHICS,
  CREATOR_VALUES,
} from '@/lib/creator'

// Keys of CreatorProfile whose values are string[] (the multi-select fields).
type ArrayKey = {
  [K in keyof CreatorProfile]: CreatorProfile[K] extends string[] ? K : never
}[keyof CreatorProfile]

const selectClass =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const OTHER = '__other__'

// Single-select with an "Other…" escape hatch that reveals a free-text input.
function SelectWithOther({
  id,
  value,
  options,
  placeholder,
  onChange,
}: {
  id?: string
  value: string
  options: string[]
  placeholder: string
  onChange: (value: string) => void
}) {
  const [other, setOther] = useState(value !== '' && !options.includes(value))

  return (
    <div className="flex flex-col gap-2">
      <select
        id={id}
        className={selectClass}
        value={other ? OTHER : value}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setOther(true)
            onChange('')
          } else {
            setOther(false)
            onChange(e.target.value)
          }
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </select>
      {other && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your own"
          autoFocus
        />
      )}
    </div>
  )
}

// Multi-select chips with the ability to add custom values.
function ChipGroup({
  options,
  selected,
  onToggle,
  onAdd,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  onAdd: (value: string) => void
}) {
  const [draft, setDraft] = useState('')
  const custom = selected.filter((s) => !options.includes(s))
  const all = [...options, ...custom]

  function commit() {
    const v = draft.trim()
    if (v) {
      onAdd(v)
      setDraft('')
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {all.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input text-muted-foreground hover:bg-muted'
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          placeholder="Add your own"
          className="max-w-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={commit}>
          Add
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  )
}

export function CreatorForm({
  displayName: initialName,
  avatarUrl: initialAvatar,
  creator: initialCreator,
}: {
  displayName: string
  avatarUrl: string
  creator: CreatorProfile
}) {
  const [displayName, setDisplayName] = useState(initialName)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar)
  const [creator, setCreator] = useState<CreatorProfile>(initialCreator)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setField<K extends keyof CreatorProfile>(key: K, value: CreatorProfile[K]) {
    setCreator((prev) => ({ ...prev, [key]: value }))
  }

  function toggleArray(key: ArrayKey, value: string) {
    setCreator((prev) => {
      const current = prev[key]
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
  }

  function addToArray(key: ArrayKey, value: string) {
    const v = value.trim()
    if (!v) return
    setCreator((prev) => {
      if (prev[key].includes(v)) return prev
      return { ...prev, [key]: [...prev[key], v] }
    })
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      // Reuse the existing avatar upload route (same one the brand form uses).
      const res = await fetch('/api/upload-logo', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        setAvatarUrl(data.url)
        toast.success('Photo uploaded')
      } else {
        toast.error(data.error ?? 'Failed to upload photo')
      }
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      // Reset so re-selecting the same file fires onChange again.
      e.target.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateCreatorProfile({
        displayName,
        avatarUrl,
        creator,
      })
      if (result.success) {
        toast.success('Profile saved')
      } else {
        toast.error(result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PageHeading
        title="Profile Info"
        subtitle="This is how you appear to brands in the Content Marketplace."
      />

      {/* Basics */}
      <Card className={`${card} ring-0`}>
        <CardHeader>
          <div className="flex items-center gap-3.5">
            <IconTile
              section="creator"
              icon={IdCard}
              className="size-11 rounded-[12px]"
              iconClassName="size-[22px]"
            />
            <div className="flex flex-col gap-1">
              <span className={microLabel}>Basics</span>
              <CardTitle>Basics</CardTitle>
              <CardDescription>Your name, handle, and bio.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field
            label="Profile photo"
            hint="Square images look best — this becomes your marketplace profile picture."
          >
            <div className="flex items-center gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profile photo"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <UserRound className="size-7 text-muted-foreground" />
                  </span>
                )}
                {uploading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <Loader2 className="size-5 animate-spin" />
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
                </Button>
                {avatarUrl && !uploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl('')}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name" htmlFor="displayName">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            </Field>
            <Field label="Handle" htmlFor="handle" hint="Your public @handle on Tala.">
              <Input
                id="handle"
                value={creator.handle}
                onChange={(e) => setField('handle', e.target.value)}
                placeholder="@yourhandle"
              />
            </Field>
          </div>

          <Field label="Bio" htmlFor="bio" hint="A short intro brands will see on your profile.">
            <textarea
              id="bio"
              value={creator.bio}
              onChange={(e) => setField('bio', e.target.value)}
              rows={4}
              className={cn(selectClass, 'h-auto py-2')}
              placeholder="Tell brands who you are and what you create."
            />
          </Field>
        </CardContent>
      </Card>

      {/* Media channels */}
      <Card className={`${card} ring-0`}>
        <CardHeader>
          <div className="flex items-center gap-3.5">
            <IconTile
              section="security"
              icon={Share2}
              className="size-11 rounded-[12px]"
              iconClassName="size-[22px]"
            />
            <div className="flex flex-col gap-1">
              <span className={microLabel}>Channels</span>
              <CardTitle>Media Channels</CardTitle>
              <CardDescription>Where you post — add your handle on each network.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {CREATOR_CHANNELS.map((channel) => (
            <Field key={channel.key} label={channel.label} htmlFor={`channel-${channel.key}`}>
              <Input
                id={`channel-${channel.key}`}
                value={creator[channel.key as ChannelKey]}
                onChange={(e) => setField(channel.key as ChannelKey, e.target.value)}
                placeholder={`${channel.prefix}handle`}
              />
            </Field>
          ))}
        </CardContent>
      </Card>

      {/* Audience & content */}
      <Card className={`${card} ring-0`}>
        <CardHeader>
          <div className="flex items-center gap-3.5">
            <IconTile
              section="wallet"
              icon={Compass}
              className="size-11 rounded-[12px]"
              iconClassName="size-[22px]"
            />
            <div className="flex flex-col gap-1">
              <span className={microLabel}>Audience &amp; content</span>
              <CardTitle>Audience &amp; Content</CardTitle>
              <CardDescription>Who you reach and what you make.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field
            label="Primary demographic"
            htmlFor="primaryDemographic"
            hint="The audience you reach most."
          >
            <SelectWithOther
              id="primaryDemographic"
              value={creator.primaryDemographic}
              options={CREATOR_DEMOGRAPHICS}
              placeholder="Select a demographic"
              onChange={(v) => setField('primaryDemographic', v)}
            />
          </Field>
          <Field label="Content categories" hint="The niches you create in.">
            <ChipGroup
              options={CONTENT_CATEGORIES}
              selected={creator.contentCategories}
              onToggle={(v) => toggleArray('contentCategories', v)}
              onAdd={(v) => addToArray('contentCategories', v)}
            />
          </Field>
          <Field label="Values" hint="What matters to you as a creator.">
            <ChipGroup
              options={CREATOR_VALUES}
              selected={creator.values}
              onToggle={(v) => toggleArray('values', v)}
              onAdd={(v) => addToArray('values', v)}
            />
          </Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending || uploading}>
            {pending ? 'Saving…' : 'Save profile'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
