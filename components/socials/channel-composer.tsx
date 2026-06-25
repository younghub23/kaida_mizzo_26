'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Sparkles, Calendar, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { savePost, getPosts, deletePost, type ScheduledPost, type SocialActionState } from '@/app/actions/social'
import { TIMEZONES, type PlatformMeta } from '@/lib/socials/platforms'
import { BrandLogo } from '@/components/socials/brand-logo'
import { InstagramPreview } from '@/components/socials/previews/instagram-preview'
import { XPreview } from '@/components/socials/previews/x-preview'
import { LinkedInPreview } from '@/components/socials/previews/linkedin-preview'
import { GenericPreview } from '@/components/socials/previews/generic-preview'

const INITIAL: SocialActionState = { error: null, success: false }

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

export function ChannelComposer({
  platform,
  username,
  onClose,
}: {
  platform: PlatformMeta
  username: string
  /** Collapse the inline composer back to just the logos. */
  onClose?: () => void
}) {
  const [state, formAction, isPending] = useActionState(savePost, INITIAL)

  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [date, setDate] = useState('')
  const [hour, setHour] = useState('09')
  const [minute, setMinute] = useState('00')
  const [timezone, setTimezone] = useState<string>(TIMEZONES[0].value)
  const [intent, setIntent] = useState<'draft' | 'schedule' | 'now'>('schedule')
  const [aiOpen, setAiOpen] = useState(false)

  const [posts, setPosts] = useState<ScheduledPost[]>([])

  async function refresh() {
    const all = await getPosts()
    setPosts(all.filter((p) => p.platforms.includes(platform.id)))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.success) {
      toast.success(
        intent === 'draft' ? 'Saved to drafts' : intent === 'now' ? 'Posted!' : 'Post scheduled!'
      )
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCaption('')
      setMediaUrl('')
      setDate('')
      void refresh()
    } else if (state.error) {
      toast.error(state.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-post-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setMediaUrl(data.url)
      else toast.error(data.error ?? 'Upload failed')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const overLimit = platform.charLimit !== null && caption.length > platform.charLimit
  const previewData = { username, caption, mediaUrl }

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center gap-3">
        <span
          className="flex size-7 items-center justify-center rounded-lg p-1 text-white"
          style={{ background: platform.gradient }}
        >
          <BrandLogo id={platform.id} />
        </span>
        <h2 className="text-xl font-semibold">{platform.label}</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto gap-1.5">
            <X className="size-4" />
            Close
          </Button>
        )}
      </div>

      <form className="grid gap-6 lg:grid-cols-2">
        {/* ---------- live preview ---------- */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Live preview</p>
          <div className="rounded-2xl bg-muted/40 p-4 sm:p-6">
            {platform.id === 'instagram' && <InstagramPreview {...previewData} />}
            {platform.id === 'x' && <XPreview {...previewData} />}
            {platform.id === 'linkedin' && <LinkedInPreview {...previewData} />}
            {!platform.dedicated && <GenericPreview {...previewData} label={platform.label} />}
          </div>
        </div>

        {/* ---------- editor ---------- */}
        <div className="flex flex-col gap-4">
          {/* media */}
          <div className="flex flex-col gap-1.5">
            <Label>Visual content</Label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" asChild className="gap-1.5">
                <label className="cursor-pointer">
                  {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                  Upload image / video
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
                </label>
              </Button>
              {mediaUrl && (
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" /> Remove
                </button>
              )}
            </div>
          </div>

          {/* caption */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="caption">Caption</Label>
              {platform.charLimit !== null && (
                <span className={cn('text-xs text-muted-foreground', overLimit && 'font-medium text-destructive')}>
                  {caption.length} / {platform.charLimit}
                </span>
              )}
            </div>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={6}
              placeholder={`Write your ${platform.label} caption…`}
              className="w-full resize-none rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="button" variant="outline" size="sm" className="w-fit gap-1.5" onClick={() => setAiOpen(true)}>
              <Sparkles className="size-3.5" />
              AI Assist
            </Button>
          </div>

          {/* schedule */}
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Calendar className="size-4" /> Schedule
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date" className="text-xs">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1 text-xs"><Clock className="size-3" /> Time</Label>
                <div className="flex gap-1.5">
                  <select value={hour} onChange={(e) => setHour(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
                    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="self-center">:</span>
                  <select value={minute} onChange={(e) => setMinute(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
                    {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Timezone</Label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
                  {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* hidden fields submitted to savePost */}
          <input type="hidden" name="platform" value={platform.id} />
          <input type="hidden" name="content" value={caption} />
          <input type="hidden" name="imageUrl" value={mediaUrl} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={`${hour}:${minute}`} />
          <input type="hidden" name="timezone" value={timezone} />
          <input type="hidden" name="intent" value={intent} />

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              formAction={formAction}
              disabled={isPending || overLimit}
              onClick={() => setIntent('schedule')}
            >
              {isPending && intent === 'schedule' ? <Loader2 className="size-4 animate-spin" /> : 'Schedule Post'}
            </Button>
            <Button
              type="submit"
              variant="outline"
              formAction={formAction}
              disabled={isPending || overLimit}
              onClick={() => setIntent('draft')}
            >
              {isPending && intent === 'draft' ? <Loader2 className="size-4 animate-spin" /> : 'Save Draft'}
            </Button>
            <Button
              type="submit"
              variant="ghost"
              formAction={formAction}
              disabled={isPending || overLimit}
              onClick={() => setIntent('now')}
            >
              {isPending && intent === 'now' ? <Loader2 className="size-4 animate-spin" /> : 'Post now'}
            </Button>
          </div>
        </div>
      </form>

      {/* scheduled & drafts for this channel */}
      {posts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Scheduled & drafts</h2>
          <div className="flex flex-col gap-2">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    post.status === 'draft' && 'bg-muted text-muted-foreground',
                    post.status === 'scheduled' && 'bg-blue-100 text-blue-700',
                    post.status === 'published' && 'bg-green-100 text-green-700',
                    post.status === 'failed' && 'bg-red-100 text-red-700'
                  )}
                >
                  {post.status}
                </span>
                <span className="min-w-0 flex-1 truncate">{post.content || '(media only)'}</span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {new Date(post.scheduled_at).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await deletePost(post.id)
                    if (res.success) {
                      toast.success('Deleted')
                      void refresh()
                    } else toast.error(res.error ?? 'Failed to delete')
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} onSelect={(t) => setCaption(t)} defaultType="social" />
    </div>
  )
}
