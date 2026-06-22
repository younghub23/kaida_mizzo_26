'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ImagePlus, ChevronLeft, ChevronRight, Sparkles, X, Loader2, Link2 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AIAssistant } from '@/components/ai/AIAssistant'
import {
  schedulePost,
  getPosts,
  deletePost,
  type ScheduledPost,
  type SocialActionState,
} from '@/app/actions/social'

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { id: 'tiktok', label: 'TikTok', color: '#000000' },
]

const CHAR_LIMIT = 280

const INITIAL_STATE: SocialActionState = { error: null, success: false }

function PlatformBadge({ id }: { id: string }) {
  const platform = PLATFORMS.find((p) => p.id === id)
  if (!platform) return null

  return (
    <span
      className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: platform.color }}
      title={platform.label}
    >
      {platform.label[0]}
    </span>
  )
}

function getWeekDays(weekOffset: number) {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

export default function SocialPage() {
  const [state, formAction, isPending] = useActionState(schedulePost, INITIAL_STATE)

  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [date, setDate] = useState('')
  const [hour, setHour] = useState('9')
  const [minute, setMinute] = useState('0')
  const [intent, setIntent] = useState<'schedule' | 'now'>('schedule')

  const [aiOpen, setAiOpen] = useState(false)

  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)

  async function refreshPosts() {
    setLoadingPosts(true)
    const data = await getPosts()
    setPosts(data)
    setLoadingPosts(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshPosts()
  }, [])

  useEffect(() => {
    if (state.success) {
      toast.success('Post scheduled!')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContent('')
      setImageUrl('')
      setSelectedPlatforms([])
      setDate('')
      void refreshPosts()
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-post-image', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.url) {
        setImageUrl(data.url)
      } else {
        toast.error(data.error ?? 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // Build a timezone-correct ISO instant from the user's chosen local date/time.
  // This runs in the browser, so it uses the user's own timezone. (The server
  // runs in UTC on Cloudflare and would otherwise misread a naive datetime,
  // publishing the post at the wrong real-world time.)
  const scheduledAt = date
    ? new Date(`${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`).toISOString()
    : ''

  const weekDays = getWeekDays(weekOffset)

  function postsForDay(day: Date) {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduled_at)
      return (
        postDate.getFullYear() === day.getFullYear() &&
        postDate.getMonth() === day.getMonth() &&
        postDate.getDate() === day.getDate()
      )
    })
  }

  async function handleDelete(id: string) {
    const res = await deletePost(id)
    if (res.success) {
      toast.success('Post deleted')
      setSelectedPost(null)
      refreshPosts()
    } else {
      toast.error(res.error ?? 'Failed to delete post')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Social Media</h1>
          <p className="text-sm text-muted-foreground">Plan, schedule, and publish your posts</p>
        </div>
        <Link href="/social/connect">
          <Button variant="outline" className="gap-2">
            <Link2 className="size-4" />
            Connect Accounts
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Post Composer</CardTitle>
              <CardDescription>Write your post and schedule it across platforms</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  <span
                    className={cn(
                      'text-xs text-muted-foreground',
                      content.length > CHAR_LIMIT && 'font-medium text-destructive'
                    )}
                  >
                    {content.length} / {CHAR_LIMIT}
                  </span>
                </div>
                <textarea
                  id="content"
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="What do you want to share?"
                  className="w-full resize-none rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit gap-1.5"
                  onClick={() => setAiOpen(true)}
                >
                  <Sparkles className="size-3.5" />
                  AI Assist
                </Button>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" asChild className="gap-1.5">
                    <label className="cursor-pointer">
                      {uploading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="size-3.5" />
                      )}
                      Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </Button>
                  {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const checked = selectedPlatforms.includes(platform.id)

                    return (
                      <label
                        key={platform.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm transition-colors',
                          checked && 'border-foreground/30 bg-muted'
                        )}
                      >
                        <input
                          type="checkbox"
                          name="platforms"
                          value={platform.id}
                          checked={checked}
                          onChange={() => togglePlatform(platform.id)}
                          className="size-3.5"
                        />
                        <PlatformBadge id={platform.id} />
                        {platform.label}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Time</Label>
                  <div className="flex gap-1.5">
                    <select
                      value={hour}
                      onChange={(e) => setHour(e.target.value)}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select
                      value={minute}
                      onChange={(e) => setMinute(e.target.value)}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>
                          {m.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <input type="hidden" name="imageUrl" value={imageUrl} />
              <input type="hidden" name="scheduledAt" value={scheduledAt || new Date().toISOString()} />
              <input type="hidden" name="intent" value={intent} />

              <div className="flex gap-2">
                <Button
                  formAction={formAction}
                  type="submit"
                  disabled={isPending}
                  onClick={() => setIntent('schedule')}
                >
                  {isPending && intent === 'schedule' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Schedule Post'
                  )}
                </Button>
                <Button
                  formAction={formAction}
                  type="submit"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setIntent('now')}
                >
                  {isPending && intent === 'now' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Post Now'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>This Week</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset((w) => w - 1)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset((w) => w + 1)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {loadingPosts ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                weekDays.map((day) => {
                  const dayPosts = postsForDay(day)

                  return (
                    <div key={day.toISOString()} className="flex flex-col gap-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      {dayPosts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border px-2.5 py-2 text-xs text-muted-foreground">
                          No posts
                        </div>
                      ) : (
                        dayPosts.map((post) => (
                          <button
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="flex flex-col gap-1 rounded-lg border border-border px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted"
                          >
                            <div className="flex gap-1">
                              {post.platforms.map((p) => (
                                <PlatformBadge key={p} id={p} />
                              ))}
                            </div>
                            <p className="truncate">{post.content.slice(0, 50)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        onSelect={(text) => setContent(text)}
        defaultType="social"
      />

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Post Details</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPost(null)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex gap-1.5">
              {selectedPost.platforms.map((p) => (
                <PlatformBadge key={p} id={p} />
              ))}
            </div>

            <p className="text-sm">{selectedPost.content}</p>

            {selectedPost.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedPost.image_url} alt="Post image" className="rounded-lg" />
            )}

            <p className="text-xs text-muted-foreground">
              Scheduled for {new Date(selectedPost.scheduled_at).toLocaleString()}
            </p>

            <Button variant="destructive" onClick={() => handleDelete(selectedPost.id)}>
              Delete Post
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
