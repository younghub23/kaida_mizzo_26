import { MessageCircle, Repeat2, Heart, BarChart3, Bookmark, Image as ImageIcon } from 'lucide-react'
import type { PreviewData } from './instagram-preview'

export function XPreview({ username, caption, mediaUrl, accent = '#1a1a1a' }: PreviewData) {
  const handle = '@' + username.toLowerCase().replace(/[^a-z0-9_]/g, '')

  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[14px] border border-black/[0.06] bg-white p-4 text-[#1a1a1a] shadow-[0_6px_22px_rgba(58,46,34,.08)]">
      <div className="flex gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: accent }}
        >
          {username.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-fredoka font-bold">{username}</span>
            <span className="text-[#8a8a8a]">{handle} · now</span>
          </div>

          <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-snug">
            {caption || <span className="text-[#8a8a8a]">What&rsquo;s happening?</span>}
          </p>

          {mediaUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-black/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl} alt="Post preview" className="max-h-72 w-full object-cover" />
            </div>
          ) : (
            <div className="mt-3 flex h-28 items-center justify-center gap-2 rounded-2xl bg-[repeating-linear-gradient(45deg,#efe9de,#efe9de_9px,#e7e0d2_9px,#e7e0d2_18px)] text-[#9a8f7c]">
              <ImageIcon className="size-5" />
              <span className="text-xs">Optional media</span>
            </div>
          )}

          <div className="mt-3 flex max-w-xs items-center justify-between text-[#8a8a8a]">
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
