import { Heart, MessageCircle, Share2, Image as ImageIcon } from 'lucide-react'
import type { PreviewData } from './instagram-preview'

export function GenericPreview({
  username,
  caption,
  mediaUrl,
  label,
}: PreviewData & { label: string }) {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
          {username.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold">{username}</p>
          <p className="text-xs text-muted-foreground">{label} · now</p>
        </div>
      </div>

      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="Post preview" className="max-h-80 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center gap-2 bg-muted text-muted-foreground">
          <ImageIcon className="size-6" />
          <span className="text-xs">Your photo or video</span>
        </div>
      )}

      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Heart className="size-5" />
          <MessageCircle className="size-5" />
          <Share2 className="size-5" />
        </div>
        <p className="whitespace-pre-wrap text-sm">
          {caption || <span className="text-muted-foreground">Your caption appears here…</span>}
        </p>
      </div>
    </div>
  )
}
