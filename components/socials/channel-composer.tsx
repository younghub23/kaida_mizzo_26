'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Sparkles, Clock, X, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { savePost, getPosts, deletePost, type ScheduledPost, type SocialActionState } from '@/app/actions/social'
import { TIMEZONES, type PlatformMeta } from '@/lib/socials/platforms'
import { BrandLogo } from '@/components/socials/brand-logo'
import { InstagramPreview } from '@/components/socials/previews/instagram-preview'
import { XPreview } from '@/components/socials/previews/x-preview'
import { LinkedInPreview } from '@/components/socials/previews/linkedin-preview'
import { FacebookPreview } from '@/components/socials/previews/facebook-preview'
import { TikTokPreview } from '@/components/socials/previews/tiktok-preview'
import { GenericPreview } from '@/components/socials/previews/generic-preview'

const INITIAL: SocialActionState = { error: null, success: false }

const fieldLabel = 'font-fredoka text-[12.5px] font-medium text-foreground'
const warmInput =
  'w-full rounded-[11px] border border-[rgba(164,141,120,0.34)] bg-card px-[13px] py-2.5 text-[13.5px] text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[rgba(164,141,120,0.15)]'

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
  const [time, setTime] = useState('09:00')
  const [timezone, setTimezone] = useState<string>(TIMEZONES[0].value)
  const [intent, setIntent] = useState<'draft' | 'schedule' | 'now'>('schedule')
  const [aiOpen, setAiOpen] = useState(false)
  // Presentational-only fields — not part of savePost's contract.
  const [firstComment, setFirstComment] = useState('')
  const [hashtags, setHashtags] = useState('')

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
  const previewData = { username, caption, mediaUrl, accent: platform.ring }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_1px_0_rgba(255,255,255,.6)_inset]">
      {/* ── Composer top bar ── */}
      <div className="flex items-center gap-3 border-b border-border px-[22px] py-4">
        <span
          className="flex size-10 items-center justify-center rounded-[11px] text-white shadow-[0_4px_14px_rgba(58,46,34,.16)]"
          style={{ background: platform.gradient }}
        >
          <span className="size-[21px]">
            <BrandLogo id={platform.id} />
          </span>
        </span>
        <div className="min-w-0">
          <div className="font-fredoka text-base font-semibold leading-tight">{platform.label}</div>
          <div className="truncate text-xs text-muted-foreground">
            Posting to @{username} · {platform.postType}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="ml-auto flex size-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* ── Body: compose | live preview ── */}
      <form className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
        {/* compose column */}
        <div className="flex flex-col gap-4 p-[22px]">
          {/* caption */}
          <div>
            <div className="mb-[7px] flex items-center justify-between">
              <span className={fieldLabel}>Caption</span>
              {platform.charLimit !== null && (
                <span
                  className={cn(
                    'text-xs text-muted-foreground',
                    overLimit && 'font-medium text-destructive'
                  )}
                >
                  {caption.length.toLocaleString()} / {platform.charLimit.toLocaleString()}
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Write your post…\n\nShare what's new with your followers — a product drop, a behind-the-scenes moment, an offer.`}
                className="min-h-[128px] w-full resize-y rounded-[12px] border border-[rgba(164,141,120,0.34)] bg-card px-4 py-3.5 text-sm leading-[1.55] text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[rgba(164,141,120,0.15)]"
              />
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-[9px] border border-[rgba(214,72,140,0.25)] bg-[linear-gradient(120deg,rgba(214,72,140,.12),rgba(224,138,60,.12))] px-2.5 py-1.5 font-fredoka text-xs font-medium text-[#A82C66] transition-[transform,background] hover:-translate-y-px hover:bg-[linear-gradient(120deg,rgba(214,72,140,.2),rgba(224,138,60,.2))]"
              >
                <Sparkles className="size-3.5" />
                Draft with AI
              </button>
            </div>
          </div>

          {/* media dropzone */}
          <label className="flex cursor-pointer items-center gap-3.5 rounded-[12px] border-[1.5px] border-dashed border-[rgba(164,141,120,0.34)] bg-[rgba(234,227,214,0.3)] p-[22px] transition-colors hover:border-primary hover:bg-[rgba(234,227,214,0.55)]">
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] border border-border bg-card">
              {uploading ? (
                <Loader2 className="size-[21px] animate-spin text-primary" />
              ) : (
                <ImagePlus className="size-[21px] text-primary" strokeWidth={1.7} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block font-fredoka text-[13.5px] font-medium">
                {mediaUrl ? 'Media added' : 'Add media'}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {mediaUrl
                  ? 'Click to replace your upload'
                  : 'Drag & drop or click to upload — JPG, PNG, MP4 up to 50MB'}
              </span>
            </span>
            {mediaUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setMediaUrl('')
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3.5" /> Remove
              </button>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>

          {/* optional fields (presentational) */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <div className="mb-[7px]">
                <span className={fieldLabel}>
                  First comment{' '}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </span>
              </div>
              <input
                value={firstComment}
                onChange={(e) => setFirstComment(e.target.value)}
                placeholder={`@${username}`}
                className={warmInput}
              />
            </div>
            <div>
              <div className="mb-[7px]">
                <span className={fieldLabel}>
                  Hashtags <span className="font-normal text-muted-foreground">(optional)</span>
                </span>
              </div>
              <input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#smallbiz #behindthescenes"
                className={warmInput}
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* schedule */}
          <div>
            <div className="mb-[7px]">
              <span className={fieldLabel}>Schedule</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.3fr_1fr_1.2fr]">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={warmInput}
              />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={warmInput}
              />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={cn(warmInput, 'col-span-2 sm:col-span-1')}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* hidden fields submitted to savePost (unchanged contract) */}
          <input type="hidden" name="platform" value={platform.id} />
          <input type="hidden" name="content" value={caption} />
          <input type="hidden" name="imageUrl" value={mediaUrl} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="timezone" value={timezone} />
          <input type="hidden" name="intent" value={intent} />

          {/* actions */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Button
              type="submit"
              formAction={formAction}
              disabled={isPending || overLimit}
              onClick={() => setIntent('now')}
              className="h-9 gap-2 px-4 font-fredoka max-sm:w-full"
            >
              {isPending && intent === 'now' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Send className="size-4" />
                  Post now
                </>
              )}
            </Button>
            <Button
              type="submit"
              variant="outline"
              formAction={formAction}
              disabled={isPending || overLimit}
              onClick={() => setIntent('schedule')}
              className="h-9 gap-2 px-4 font-fredoka max-sm:w-full"
            >
              {isPending && intent === 'schedule' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Clock className="size-4" />
                  Schedule
                </>
              )}
            </Button>
            <Button
              type="submit"
              variant="ghost"
              formAction={formAction}
              disabled={isPending || overLimit}
              onClick={() => setIntent('draft')}
              className="h-9 px-4 font-fredoka max-sm:w-full"
            >
              {isPending && intent === 'draft' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Save draft'
              )}
            </Button>
          </div>
        </div>

        {/* live preview column */}
        <div className="flex flex-col gap-3.5 border-t border-border bg-[linear-gradient(180deg,rgba(234,227,214,.4),rgba(234,227,214,.18))] p-[22px] lg:border-l lg:border-t-0">
          <span className="font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
            Live preview
          </span>
          {platform.id === 'instagram' && <InstagramPreview {...previewData} />}
          {platform.id === 'x' && <XPreview {...previewData} />}
          {platform.id === 'linkedin' && <LinkedInPreview {...previewData} />}
          {platform.id === 'facebook' && <FacebookPreview {...previewData} />}
          {platform.id === 'tiktok' && <TikTokPreview {...previewData} />}
          {!platform.dedicated && <GenericPreview {...previewData} label={platform.label} />}
          <p className="text-center font-dm-serif text-[11.5px] italic text-muted-foreground">
            {platform.previewFootnote}
          </p>
        </div>
      </form>

      {/* ── Scheduled & drafts for this channel ── */}
      {posts.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border p-[22px]">
          <span className="font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
            Scheduled &amp; drafts
          </span>
          <div className="flex flex-col gap-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 rounded-[11px] border border-border bg-card px-3 py-2 text-sm"
              >
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    post.status === 'draft' && 'bg-accent text-muted-foreground',
                    post.status === 'scheduled' && 'bg-[#F9E4EE] text-[#A82C66]',
                    post.status === 'published' && 'bg-[#DCF1F2] text-[#1E7B82]',
                    post.status === 'failed' && 'bg-[#FBE7E0] text-[#B5604A]'
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
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        onSelect={(t) => setCaption(t)}
        defaultType="social"
      />
    </div>
  )
}
