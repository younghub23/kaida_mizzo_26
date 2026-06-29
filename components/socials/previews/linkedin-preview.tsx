import { ThumbsUp, MessageCircle, Repeat2, Send, Globe, MoreHorizontal, Image as ImageIcon } from 'lucide-react'
import type { PreviewData } from './instagram-preview'

export function LinkedInPreview({ username, caption, mediaUrl, accent = '#0A66C2' }: PreviewData) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[14px] border border-black/[0.06] bg-white text-[#1a1a1a] shadow-[0_6px_22px_rgba(58,46,34,.08)]">
      {/* header */}
      <div className="flex items-start gap-2.5 p-4 pb-2">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
          style={{ background: accent }}
        >
          {username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-fredoka text-sm font-semibold leading-tight">{username}</p>
          <p className="text-xs text-[#8a8a8a]">Business · Following</p>
          <p className="flex items-center gap-1 text-xs text-[#8a8a8a]">
            now · <Globe className="size-3" />
          </p>
        </div>
        <MoreHorizontal className="size-5 text-[#8a8a8a]" />
      </div>

      {/* body */}
      <div className="px-4 pb-2">
        <p className="whitespace-pre-wrap text-sm leading-snug">
          {caption || (
            <span className="text-[#8a8a8a]">Share an update, article, or announcement…</span>
          )}
        </p>
      </div>

      {/* media */}
      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="Post preview" className="max-h-80 w-full object-cover" />
      ) : (
        <div className="mx-4 mb-2 flex h-32 items-center justify-center gap-2 rounded-md bg-[repeating-linear-gradient(45deg,#efe9de,#efe9de_9px,#e7e0d2_9px,#e7e0d2_18px)] text-[#9a8f7c]">
          <ImageIcon className="size-5" />
          <span className="text-xs">Optional media</span>
        </div>
      )}

      {/* reactions */}
      <div className="flex items-center justify-between border-t border-black/[0.06] px-2 py-1.5 text-xs font-medium text-[#8a8a8a]">
        <span className="flex items-center gap-1.5 px-2 py-1.5"><ThumbsUp className="size-4" /> Like</span>
        <span className="flex items-center gap-1.5 px-2 py-1.5"><MessageCircle className="size-4" /> Comment</span>
        <span className="flex items-center gap-1.5 px-2 py-1.5"><Repeat2 className="size-4" /> Repost</span>
        <span className="flex items-center gap-1.5 px-2 py-1.5"><Send className="size-4" /> Send</span>
      </div>
    </div>
  )
}
