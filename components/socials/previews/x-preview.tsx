import { MessageCircle, Repeat2, Heart, BarChart3, Bookmark, Image as ImageIcon } from 'lucide-react'
import type { PreviewData } from './instagram-preview'

export function XPreview({ username, caption, mediaUrl }: PreviewData) {
  const handle = '@' + username.toLowerCase().replace(/[^a-z0-9_]/g, '')

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background p-4">
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
          {username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold">{username}</span>
            <span className="text-muted-foreground">{handle} · now</span>
          </div>

          <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-snug">
            {caption || <span className="text-muted-foreground">What’s happening?</span>}
          </p>

          {mediaUrl && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl} alt="Post preview" className="max-h-72 w-full object-cover" />
            </div>
          )}
          {!mediaUrl && (
            <div className="mt-3 flex h-28 items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground">
              <ImageIcon className="size-5" />
              <span className="text-xs">Optional media</span>
            </div>
          )}

          <div className="mt-3 flex max-w-xs items-center justify-between text-muted-foreground">
            <MessageCircle className="size-[18px]" />
            <Repeat2 className="size-[18px]" />
            <Heart className="size-[18px]" />
            <BarChart3 className="size-[18px]" />
            <Bookmark className="size-[18px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
