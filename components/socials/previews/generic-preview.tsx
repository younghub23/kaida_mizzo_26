import { Heart, MessageCircle, Share2 } from 'lucide-react'
import type { PreviewData } from './instagram-preview'

export function GenericPreview({
  username,
  caption,
  mediaUrl,
  accent = '#a48d78',
  label,
}: PreviewData & { label: string }) {
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[14px] border border-black/[0.06] bg-white text-[#1a1a1a] shadow-[0_6px_22px_rgba(58,46,34,.08)]">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div
          className="flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: accent }}
        >
          {username.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-fredoka text-sm font-semibold">{username}</p>
          <p className="text-xs text-[#8a8a8a]">{label} · now</p>
        </div>
      </div>

      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="Post preview" className="max-h-80 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center bg-[repeating-linear-gradient(45deg,#efe9de,#efe9de_9px,#e7e0d2_9px,#e7e0d2_18px)]">
          <span className="rounded-md bg-white/70 px-2 py-1 font-mono text-[11px] text-[#9a8f7c]">
            image placeholder
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-4 text-[#8a8a8a]">
          <Heart className="size-5" />
          <MessageCircle className="size-5" />
          <Share2 className="size-5" />
        </div>
        <p className="whitespace-pre-wrap text-[12.5px] leading-[1.45]">
          {caption || (
            <span className="text-[#8a8a8a]">Your caption preview shows up here as you type…</span>
          )}
        </p>
      </div>
    </div>
  )
}
