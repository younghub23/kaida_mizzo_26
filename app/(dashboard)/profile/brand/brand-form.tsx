'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Sparkles, Store, Loader2 } from 'lucide-react'
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
import { updateBrandProfile } from '@/app/actions/profile'
import { PageHeading } from '../page-heading'
import { fieldLabel, microLabel, chipPalettes, type ChipPalette } from '../ui'
import {
  type BrandProfile,
  BRAND_TYPES,
  TEAM_SIZES,
  AGE_RANGES,
  GENDERS,
  BRAND_VOICES,
  BRAND_VALUES,
  PRIMARY_GOALS,
  PLATFORMS,
} from '@/lib/brand'

// Keys of BrandProfile whose values are string[] (the multi-select fields).
type ArrayKey = {
  [K in keyof BrandProfile]: BrandProfile[K] extends string[] ? K : never
}[keyof BrandProfile]

const INDUSTRIES = [
  'Retail',
  'Restaurant',
  'Healthcare',
  'Fitness',
  'Beauty',
  'Real Estate',
  'Tech',
]

const selectClass =
  'h-9 w-full min-w-0 rounded-[11px] border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-[#a48d78] focus-visible:ring-[3px] focus-visible:ring-[rgba(164,141,120,.15)] dark:bg-input/30'

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

// Multi-select chips with the ability to add custom values. Each group rotates
// one warm category palette: selected chips fill with that palette, unselected
// chips sit on the soft beige `--accent` fill and pick up a faint tint on hover.
function ChipGroup({
  options,
  selected,
  onToggle,
  onAdd,
  palette,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  onAdd: (value: string) => void
  palette: ChipPalette
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
              style={
                active
                  ? { background: palette.bg, borderColor: palette.border, color: palette.text }
                  : ({ '--chip-tint': palette.bg } as React.CSSProperties)
              }
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                active
                  ? 'font-medium'
                  : 'border-border bg-accent text-muted-foreground hover:bg-[var(--chip-tint)] hover:text-foreground'
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
      <Label htmlFor={htmlFor} className={fieldLabel}>
        {label}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  )
}

export function BrandForm({
  businessName: initialName,
  industry: initialIndustry,
  avatarUrl: initialAvatar,
  brand: initialBrand,
  aiEnabled,
}: {
  businessName: string
  industry: string
  avatarUrl: string
  brand: BrandProfile
  aiEnabled: boolean
}) {
  const [businessName, setBusinessName] = useState(initialName)
  const [industry, setIndustry] = useState(initialIndustry)
  const [logoUrl, setLogoUrl] = useState(initialAvatar)
  const [brand, setBrand] = useState<BrandProfile>(initialBrand)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setField<K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) {
    setBrand((prev) => {
      const next = { ...prev }
      next[key] = value
      return next
    })
  }

  function toggleArray(key: ArrayKey, value: string) {
    setBrand((prev) => {
      const next = { ...prev }
      const current = prev[key]
      next[key] = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return next
    })
  }

  function addToArray(key: ArrayKey, value: string) {
    const v = value.trim()
    if (!v) return
    setBrand((prev) => {
      if (prev[key].includes(v)) return prev
      const next = { ...prev }
      next[key] = [...prev[key], v]
      return next
    })
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload-logo', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        setLogoUrl(data.url)
        toast.success('Logo uploaded')
      } else {
        toast.error(data.error ?? 'Failed to upload logo')
      }
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
      // Reset so re-selecting the same file fires onChange again.
      e.target.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateBrandProfile({
        businessName,
        industry,
        avatarUrl: logoUrl,
        brand,
      })
      if (result.success) {
        toast.success('Brand info saved')
      } else {
        toast.error(result.error ?? 'Failed to save')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PageHeading
        title="Brand Info"
        subtitle="Tell us about your brand. The more we know, the better Tala can market for you."
      />

      <div
        className={cn(
          'flex items-start gap-2 rounded-[12px] border p-3 text-sm',
          aiEnabled
            ? 'border-[rgba(214,73,140,.3)] bg-[#F9E4EE]/60 text-foreground'
            : 'border-input bg-muted/40 text-muted-foreground'
        )}
      >
        <Sparkles
          className="mt-0.5 size-4 shrink-0"
          style={aiEnabled ? { color: '#D6488C' } : undefined}
        />
        <p>
          {aiEnabled
            ? 'This information is used as context for your AI assistant and your public marketplace brand profile.'
            : 'AI assistance is available on Growth, Pro, and Agency plans. Your answers are still saved and power your marketplace brand profile.'}
        </p>
      </div>

      {/* Basics */}
      <Card>
        <CardHeader>
          <span className={microLabel}>Identity</span>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Your business identity and branding.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field
            label="Logo"
            hint="Square images look best — this becomes your marketplace profile picture."
          >
            <div className="flex items-center gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Brand logo"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <Store className="size-7 text-muted-foreground" />
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
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading
                    ? 'Uploading…'
                    : logoUrl
                      ? 'Change photo'
                      : 'Upload photo'}
                </Button>
                {logoUrl && !uploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLogoUrl('')}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </Field>

          <Field label="Business name" htmlFor="businessName">
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry" htmlFor="industry">
              <SelectWithOther
                id="industry"
                value={industry}
                options={INDUSTRIES}
                placeholder="Select an industry"
                onChange={setIndustry}
              />
            </Field>

            <Field label="Brand type" htmlFor="brandType">
              <SelectWithOther
                id="brandType"
                value={brand.brandType}
                options={BRAND_TYPES}
                placeholder="Select a type"
                onChange={(v) => setField('brandType', v)}
              />
            </Field>
          </div>

          <Field label="Tagline" htmlFor="tagline" hint="A short one-liner that sums up your brand.">
            <Input
              id="tagline"
              value={brand.tagline}
              onChange={(e) => setField('tagline', e.target.value)}
              placeholder="Marketing made simple"
            />
          </Field>

          <Field label="Description" htmlFor="description" hint="What does your business do?">
            <textarea
              id="description"
              value={brand.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={4}
              className={cn(selectClass, 'h-auto rounded-[12px] py-2')}
              placeholder="Tell us about your products, services, and what makes you different."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Website" htmlFor="website">
              <Input
                id="website"
                value={brand.website}
                onChange={(e) => setField('website', e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="Founded" htmlFor="foundedYear">
              <Input
                id="foundedYear"
                value={brand.foundedYear}
                onChange={(e) => setField('foundedYear', e.target.value)}
                placeholder="2020"
                inputMode="numeric"
              />
            </Field>
            <Field label="Team size" htmlFor="teamSize">
              <SelectWithOther
                id="teamSize"
                value={brand.teamSize}
                options={TEAM_SIZES}
                placeholder="Select"
                onChange={(v) => setField('teamSize', v)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Audience */}
      <Card>
        <CardHeader>
          <span className={microLabel}>Reach</span>
          <CardTitle>Audience</CardTitle>
          <CardDescription>Who are you trying to reach?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Target age ranges">
            <ChipGroup
              options={AGE_RANGES}
              selected={brand.targetAgeRanges}
              onToggle={(v) => toggleArray('targetAgeRanges', v)}
              onAdd={(v) => addToArray('targetAgeRanges', v)}
              palette={chipPalettes[0]}
            />
          </Field>
          <Field label="Target genders">
            <ChipGroup
              options={GENDERS}
              selected={brand.targetGenders}
              onToggle={(v) => toggleArray('targetGenders', v)}
              onAdd={(v) => addToArray('targetGenders', v)}
              palette={chipPalettes[1]}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Locations" htmlFor="targetLocations" hint="Cities, regions, or countries.">
              <Input
                id="targetLocations"
                value={brand.targetLocations}
                onChange={(e) => setField('targetLocations', e.target.value)}
                placeholder="e.g. US, Canada, UK"
              />
            </Field>
            <Field label="Interests" htmlFor="targetInterests" hint="What does your audience care about?">
              <Input
                id="targetInterests"
                value={brand.targetInterests}
                onChange={(e) => setField('targetInterests', e.target.value)}
                placeholder="e.g. fitness, sustainability"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Positioning */}
      <Card>
        <CardHeader>
          <span className={microLabel}>Voice</span>
          <CardTitle>Positioning &amp; Goals</CardTitle>
          <CardDescription>How your brand sounds and what success looks like.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Brand voice">
            <ChipGroup
              options={BRAND_VOICES}
              selected={brand.brandVoice}
              onToggle={(v) => toggleArray('brandVoice', v)}
              onAdd={(v) => addToArray('brandVoice', v)}
              palette={chipPalettes[2]}
            />
          </Field>
          <Field label="Brand values">
            <ChipGroup
              options={BRAND_VALUES}
              selected={brand.brandValues}
              onToggle={(v) => toggleArray('brandValues', v)}
              onAdd={(v) => addToArray('brandValues', v)}
              palette={chipPalettes[3]}
            />
          </Field>
          <Field label="Primary goals">
            <ChipGroup
              options={PRIMARY_GOALS}
              selected={brand.primaryGoals}
              onToggle={(v) => toggleArray('primaryGoals', v)}
              onAdd={(v) => addToArray('primaryGoals', v)}
              palette={chipPalettes[4]}
            />
          </Field>
          <Field label="Preferred platforms">
            <ChipGroup
              options={PLATFORMS}
              selected={brand.preferredPlatforms}
              onToggle={(v) => toggleArray('preferredPlatforms', v)}
              onAdd={(v) => addToArray('preferredPlatforms', v)}
              palette={chipPalettes[5]}
            />
          </Field>
          <Field label="Content topics" htmlFor="contentTopics" hint="Comma-separated themes you post about.">
            <Input
              id="contentTopics"
              value={brand.contentTopics.join(', ')}
              onChange={(e) =>
                setField(
                  'contentTopics',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder="e.g. recipes, behind the scenes, promos"
            />
          </Field>
          <Field label="Unique selling point" htmlFor="usp" hint="What sets you apart from competitors?">
            <textarea
              id="usp"
              value={brand.uniqueSellingPoint}
              onChange={(e) => setField('uniqueSellingPoint', e.target.value)}
              rows={3}
              className={cn(selectClass, 'h-auto rounded-[12px] py-2')}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Competitors" htmlFor="competitors">
              <Input
                id="competitors"
                value={brand.competitors}
                onChange={(e) => setField('competitors', e.target.value)}
                placeholder="Comma-separated"
              />
            </Field>
            <Field label="Brand colors" htmlFor="brandColors" hint="Hex codes or names.">
              <Input
                id="brandColors"
                value={brand.brandColors}
                onChange={(e) => setField('brandColors', e.target.value)}
                placeholder="#C13A77, cream"
              />
            </Field>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending || uploading}>
            {pending ? 'Saving…' : 'Save brand info'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
