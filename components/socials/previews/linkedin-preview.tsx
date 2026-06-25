import { ThumbsUp, MessageCircle, Repeat2, Send, Globe, MoreHorizontal, Image as ImageIcon } from 'lucide-react'
import type { PreviewData } from './instagram-preview'

export function LinkedInPreview({ username, caption, mediaUrl }: PreviewData) {
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background">
      {/* header */}
      <div className="flex items-start gap-2.5 p-4 pb-2">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-base font-semibold text-white">
          {username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{username}</p>
          <p className="text-xs text-muted-foreground">Business · Following</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            now · <Globe className="size-3" />
          </p>
        </div>
        <MoreHorizontal className="size-5 text-muted-foreground" />
      </div>

      {/* body */}
      <div className="px-4 pb-2">
        <p className="whitespace-pre-wrap text-sm leading-snug">
          {caption || <span className="text-muted-foreground">Share an update, article, or announcement…</span>}
        </p>
      </div>

      {/* media */}
      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="Post preview" className="max-h-80 w-full object-cover" />
      ) : (
        <div className="mx-4 mb-2 flex h-32 items-center justify-center gap-2 rounded-md border border-dashed border-border text-muted-foreground">
          <ImageIcon className="size-5" />
          <span className="text-xs">Optional media</span>
        </div>
      )}

      {/* reactions */}
      <div className="flex items-center justify-between border-t border-border px-2 py-1.5 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5 px-2 py-1.5"><ThumbsUp className="size-4" /> Like</span>
        <span className="flex items-center gap-1.5 px-2 py-1.5"><MessageCircle className="size-4" /> Comment</span>
        <span className="flex items-center gap-1.5 px-2 py-1.5"><Repeat2 className="size-4" /> Repost</span>
        <span className="flex items-center gap-1.5 px-2 py-1.5"><Send className="size-4" /> Send</span>
      </div>
    </div>
  )
}
