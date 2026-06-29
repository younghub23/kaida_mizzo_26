import { Heart, MessageCircle, Bookmark, Share2, Music2, Plus } from 'lucide-react'
import type { PreviewData } from './instagram-preview'

// True TikTok chrome: a 9:16 full-bleed video canvas with the right-rail action
// stack and a caption overlaid bottom-left — not the generic feed card.
export function TikTokPreview({ username, caption, mediaUrl, accent = '#FE2C55' }: PreviewData) {
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-[14px] bg-black text-white shadow-[0_6px_22px_rgba(58,46,34,.08)]">
      {/* video canvas */}
      {mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt="Post preview" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center bg-[repeating-linear-gradient(45deg,#2a2a2a,#2a2a2a_9px,#1c1c1c_9px,#1c1c1c_18px)]">
          <span className="rounded-md bg-black/50 px-2 py-1 font-mono text-[11px] text-white/70">
            9:16 video · 1080×1920
          </span>
        </div>
      )}

      {/* subtle gradient so overlays stay legible over any media */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.15),transparent_22%,transparent_60%,rgba(0,0,0,.55))]" />

      {/* right action rail */}
      <div className="absolute bottom-[68px] right-2.5 flex flex-col items-center gap-[18px]">
        <div className="relative">
          <div
            className="flex size-10 items-center justify-center rounded-full border-2 border-white text-sm font-semibold"
            style={{ background: accent }}
          >
            {username.slice(0, 1).toUpperCase()}
          </div>
          <span
            className="absolute -bottom-1.5 left-1/2 flex size-[18px] -translate-x-1/2 items-center justify-center rounded-full text-white"
            style={{ background: accent }}
          >
            <Plus className="size-3" strokeWidth={3} />
          </span>
        </div>
        <RailAction icon={<Heart className="size-7 fill-white" />} label="0" />
        <RailAction icon={<MessageCircle className="size-7 fill-white" />} label="0" />
        <RailAction icon={<Bookmark className="size-7 fill-white" />} label="0" />
        <RailAction icon={<Share2 className="size-7 fill-white" />} label="Share" />
      </div>

      {/* caption overlay bottom-left */}
      <div className="absolute inset-x-0 bottom-0 p-3 pr-14">
        <p className="font-fredoka text-[13px] font-semibold">@{username}</p>
        <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-xs leading-snug">
          {caption || <span className="text-white/70">Your caption preview shows up here…</span>}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px]">
          <Music2 className="size-3" /> Original sound · {username}
        </p>
      </div>
    </div>
  )
}

function RailAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.4)]">
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
  )
}
