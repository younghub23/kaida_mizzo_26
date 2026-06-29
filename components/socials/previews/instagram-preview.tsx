import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'

export type PreviewData = {
  username: string
  caption: string
  mediaUrl: string
  /** Brand color used for the avatar fill. */
  accent?: string
}

// Authentic platform chrome sits on a white card (not the warm page surface) so
// the preview reads like the real feed. Shared shell classes keep that consistent
// across the dedicated previews.
const card =
  'mx-auto w-full max-w-[340px] overflow-hidden rounded-[14px] border border-black/[0.06] bg-white text-[#1a1a1a] shadow-[0_6px_22px_rgba(58,46,34,.08)]'

export function InstagramPreview({ username, caption, mediaUrl, accent = '#d6249f' }: PreviewData) {
  return (
    <div className={card}>
      {/* header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className="flex size-[34px] items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ background: accent }}
        >
          {username.slice(0, 1).toUpperCase()}
        </div>
        <span className="font-fredoka text-[13.5px] font-semibold">{username}</span>
        <MoreHorizontal className="ml-auto size-4 text-[#8a8a8a]" />
      </div>

      {/* media */}
      <div className="relative aspect-square w-full bg-[repeating-linear-gradient(45deg,#efe9de,#efe9de_9px,#e7e0d2_9px,#e7e0d2_18px)]">
        {mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl} alt="Post preview" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="rounded-md bg-white/70 px-2 py-1 font-mono text-[11px] text-[#9a8f7c]">
              image placeholder · 1080×1080
            </span>
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex items-center gap-4 px-3 pt-2.5 text-[#1a1a1a]">
        <Heart className="size-[22px]" strokeWidth={1.8} />
        <MessageCircle className="size-[22px]" strokeWidth={1.8} />
        <Send className="size-[22px]" strokeWidth={1.8} />
        <Bookmark className="ml-auto size-[22px]" strokeWidth={1.8} />
      </div>

      {/* caption (no fabricated like-count) */}
      <div className="flex flex-col gap-1 px-3 pb-3 pt-2">
        <p className="text-[12.5px] leading-[1.45]">
          <span className="font-fredoka font-semibold">{username}</span>{' '}
          {caption ? (
            <span className="whitespace-pre-wrap">{caption}</span>
          ) : (
            <span className="text-[#8a8a8a]">Your caption preview shows up here as you type…</span>
          )}
        </p>
      </div>
    </div>
  )
}
