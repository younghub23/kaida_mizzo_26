'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Sparkles, Store } from 'lucide-react'
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
  'Other',
]

const selectClass =
  'h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
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
      } else {
        toast.error(data.error ?? 'Failed to upload logo')
      }
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
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
      <div>
        <h1 className="text-2xl font-semibold">Brand info</h1>
        <p className="text-sm text-muted-foreground">
          Tell us about your brand. The more we know, the better Tala can market
          for you.
        </p>
      </div>

      <div
        className={cn(
          'flex items-start gap-2 rounded-lg border p-3 text-sm',
          aiEnabled
            ? 'border-primary/30 bg-primary/5'
            : 'border-input bg-muted/40 text-muted-foreground'
        )}
      >
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <p>
          {aiEnabled
            ? 'This information is used as context for your AI assistant and your public marketplace brand profile.'
            : 'AI assistance is available on Growth, Pro, and Agency plans. Your answers are still saved and power your marketplace brand profile.'}
        </p>
      </div>

      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Your business identity and branding.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Business name" htmlFor="businessName">
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </Field>

          <Field label="Logo">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="size-16 rounded-lg object-cover ring-1 ring-foreground/10"
                />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-lg bg-muted">
                  <Store className="size-6 text-muted-foreground" />
                </span>
              )}
              <Input
                id="logo"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleLogoChange}
                disabled={uploading}
                className="max-w-xs"
              />
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry" htmlFor="industry">
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={selectClass}
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Brand type" htmlFor="brandType">
              <select
                id="brandType"
                value={brand.brandType}
                onChange={(e) => setField('brandType', e.target.value)}
                className={selectClass}
              >
                <option value="">Select a type</option>
                {BRAND_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
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
              className={cn(selectClass, 'h-auto py-2')}
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
              <select
                id="teamSize"
                value={brand.teamSize}
                onChange={(e) => setField('teamSize', e.target.value)}
                className={selectClass}
              >
                <option value="">Select</option>
                {TEAM_SIZES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Audience */}
      <Card>
        <CardHeader>
          <CardTitle>Audience</CardTitle>
          <CardDescription>Who are you trying to reach?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Target age ranges">
            <ChipGroup
              options={AGE_RANGES}
              selected={brand.targetAgeRanges}
              onToggle={(v) => toggleArray('targetAgeRanges', v)}
            />
          </Field>
          <Field label="Target genders">
            <ChipGroup
              options={GENDERS}
              selected={brand.targetGenders}
              onToggle={(v) => toggleArray('targetGenders', v)}
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
          <CardTitle>Positioning &amp; goals</CardTitle>
          <CardDescription>How your brand sounds and what success looks like.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Brand voice">
            <ChipGroup
              options={BRAND_VOICES}
              selected={brand.brandVoice}
              onToggle={(v) => toggleArray('brandVoice', v)}
            />
          </Field>
          <Field label="Brand values">
            <ChipGroup
              options={BRAND_VALUES}
              selected={brand.brandValues}
              onToggle={(v) => toggleArray('brandValues', v)}
            />
          </Field>
          <Field label="Primary goals">
            <ChipGroup
              options={PRIMARY_GOALS}
              selected={brand.primaryGoals}
              onToggle={(v) => toggleArray('primaryGoals', v)}
            />
          </Field>
          <Field label="Preferred platforms">
            <ChipGroup
              options={PLATFORMS}
              selected={brand.preferredPlatforms}
              onToggle={(v) => toggleArray('preferredPlatforms', v)}
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
              className={cn(selectClass, 'h-auto py-2')}
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
