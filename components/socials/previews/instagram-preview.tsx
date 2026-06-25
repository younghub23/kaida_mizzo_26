import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Image as ImageIcon } from 'lucide-react'

export type PreviewData = {
  username: string
  caption: string
  mediaUrl: string
}

export function InstagramPreview({ username, caption, mediaUrl }: PreviewData) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-border bg-background">
      {/* header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className="size-8 rounded-full p-[2px]"
          style={{ background: 'linear-gradient(45deg,#feda75,#d62976,#4f5bd5)' }}
        >
          <div className="flex size-full items-center justify-center rounded-full bg-background text-xs font-semibold">
            {username.slice(0, 1).toUpperCase()}
          </div>
        </div>
        <span className="text-sm font-semibold">{username}</span>
        <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
      </div>

      {/* media */}
      <div className="relative aspect-square w-full bg-muted">
        {mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="Post preview" className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-xs">Your photo or video</span>
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex items-center gap-4 px-3 pt-2.5">
        <Heart className="size-6" />
        <MessageCircle className="size-6" />
        <Send className="size-6" />
        <Bookmark className="ml-auto size-6" />
      </div>

      {/* likes + caption */}
      <div className="flex flex-col gap-1 px-3 pb-3 pt-2">
        <span className="text-sm font-semibold">Liked by you and others</span>
        <p className="text-sm leading-snug">
          <span className="font-semibold">{username}</span>{' '}
          {caption ? (
            <span className="whitespace-pre-wrap">{caption}</span>
          ) : (
            <span className="text-muted-foreground">Your caption appears here…</span>
          )}
        </p>
      </div>
    </div>
  )
}
