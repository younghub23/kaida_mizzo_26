import { ThumbsUp, MessageCircle, Share2, Globe, MoreHorizontal } from 'lucide-react'
import type { PreviewData } from './instagram-preview'

// True Facebook chrome: profile row + timestamp/globe, text above a full-width
// image, and the Like / Comment / Share bar.
export function FacebookPreview({ username, caption, mediaUrl, accent = '#0866FF' }: PreviewData) {
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[14px] border border-black/[0.06] bg-white text-[#1a1a1a] shadow-[0_6px_22px_rgba(58,46,34,.08)]">
      {/* header */}
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: accent }}
        >
          {username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-fredoka text-sm font-semibold leading-tight">{username}</p>
          <p className="flex items-center gap-1 text-xs text-[#8a8a8a]">
            Just now · <Globe className="size-3" />
          </p>
        </div>
        <MoreHorizontal className="size-5 text-[#8a8a8a]" />
      </div>

      {/* text above the media */}
      <div className="px-3 pb-2.5">
        <p className="whitespace-pre-wrap text-[13px] leading-snug">
          {caption || (
            <span className="text-[#8a8a8a]">
              What&rsquo;s on your mind? Your caption preview shows up here…
            </span>
          )}
        </p>
      </div>

      {/* full-width media */}
      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="Post preview" className="max-h-80 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-[repeating-linear-gradient(45deg,#efe9de,#efe9de_9px,#e7e0d2_9px,#e7e0d2_18px)]">
          <span className="rounded-md bg-white/70 px-2 py-1 font-mono text-[11px] text-[#9a8f7c]">
            link + image
          </span>
        </div>
      )}

      {/* action bar */}
      <div className="flex items-center justify-between border-t border-black/[0.06] px-2 py-1 text-[13px] font-medium text-[#65676b]">
        <span className="flex flex-1 items-center justify-center gap-1.5 py-2">
          <ThumbsUp className="size-[18px]" /> Like
        </span>
        <span className="flex flex-1 items-center justify-center gap-1.5 py-2">
          <MessageCircle className="size-[18px]" /> Comment
        </span>
        <span className="flex flex-1 items-center justify-center gap-1.5 py-2">
          <Share2 className="size-[18px]" /> Share
        </span>
      </div>
    </div>
  )
}
