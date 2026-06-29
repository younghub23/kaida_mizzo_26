'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Sparkles, CalendarDays, X } from 'lucide-react'
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

export function ChannelComposer({
  platform,
  username,
  onClose,
}: {
  platform: PlatformMeta
  username: string
  /** Collapse the inline composer back to just the channel cards. */
  onClose?: () => void
}) {
  const [state, formAction, isPending] = useActionState(savePost, INITIAL)

  const [caption, setCaption] = useState('')
  const [firstComment, setFirstComment] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:30')
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
      setFirstComment('')
      setHashtags('')
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
  // Hashtags ride along in the saved content; the live preview shows the caption.
  const content = [caption, hashtags.trim()].filter(Boolean).join('\n\n')

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 items-center justify-center rounded-xl p-2 text-white shadow-sm"
          style={{ background: platform.gradient }}
        >
          <BrandLogo id={platform.id} />
        </span>
        <div className="min-w-0">
          <h2 className="font-fredoka text-lg font-bold leading-tight">{platform.label}</h2>
          <p className="truncate text-xs text-muted-foreground">
            Posting to @{username} · Feed post
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close composer"
            className="ml-auto flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <form className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* ---------- editor ---------- */}
        <div className="flex flex-col gap-5">
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
            <div className="relative">
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                placeholder={`Write your post…\nShare what's new with your followers — a product drop, a behind-the-scenes moment, an offer.`}
                className="w-full resize-none rounded-xl border border-input bg-transparent p-3 pb-14 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(214,72,140,.3)] bg-[#F9E4EE] px-3 py-1.5 text-xs font-medium text-[#A82C66] transition-colors hover:bg-[#f6d9e8]"
              >
                <Sparkles className="size-3.5" />
                Draft with AI
              </button>
            </div>
          </div>

          {/* add media */}
          {mediaUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl} alt="Upload preview" className="max-h-56 w-full object-cover" />
              <button
                type="button"
                onClick={() => setMediaUrl('')}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white hover:bg-black/70"
              >
                <X className="size-3.5" /> Remove
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors hover:bg-muted/50">
              <span className="flex size-11 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm">
                {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              </span>
              <span className="text-sm font-medium">Add media</span>
              <span className="text-xs text-muted-foreground">
                Drag &amp; drop or click to upload — JPG, PNG, MP4 up to 50MB
              </span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            </label>
          )}

          {/* first comment + hashtags */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="first-comment">
                First comment <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="first-comment"
                value={firstComment}
                onChange={(e) => setFirstComment(e.target.value)}
                placeholder={`@${username}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hashtags">
                Hashtags <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#yourbrand #smallbiz"
              />
            </div>
          </div>

          {/* schedule */}
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarDays className="size-4" /> Schedule
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                aria-label="Timezone"
                className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* hidden fields submitted to savePost */}
          <input type="hidden" name="platform" value={platform.id} />
          <input type="hidden" name="content" value={content} />
          <input type="hidden" name="firstComment" value={firstComment} />
          <input type="hidden" name="imageUrl" value={mediaUrl} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />
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

        {/* ---------- live preview ---------- */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Live preview
          </p>
          <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
            {platform.id === 'instagram' && <InstagramPreview {...previewData} />}
            {platform.id === 'x' && <XPreview {...previewData} />}
            {platform.id === 'linkedin' && <LinkedInPreview {...previewData} />}
            {!platform.dedicated && <GenericPreview {...previewData} label={platform.label} />}
          </div>
        </div>
      </form>

      {/* scheduled & drafts for this channel */}
      {posts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Scheduled &amp; drafts</h2>
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
