import type { PlatformId } from '@/lib/socials/platforms'

// Inline, brand-accurate SVG glyphs (white fill, sized to fill their tile).
// Kept as paths so the logos stay crisp at any size with no asset loading.

function Instagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-full" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="7" r="1.4" fill="currentColor" />
    </svg>
  )
}

function X() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}

function LinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

function Facebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full" aria-hidden>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  )
}

function TikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full" aria-hidden>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.2v12.93a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06v-3.3a5.9 5.9 0 0 0-.77-.05 5.84 5.84 0 1 0 5.84 5.84V9.01a7.5 7.5 0 0 0 4.35 1.39V7.2a4.28 4.28 0 0 1-3.34-1.38Z" />
    </svg>
  )
}

function Google() {
  return (
    <svg viewBox="0 0 24 24" className="size-full" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.93h5.5a4.7 4.7 0 0 1-2.04 3.08l3.3 2.56c1.92-1.78 3.02-4.4 3.02-7.5 0-.72-.06-1.4-.18-2.07H12Z" />
      <path fill="#34A853" d="M5.27 14.28A7.06 7.06 0 0 1 4.9 12c0-.8.14-1.57.37-2.28L1.93 7.16A11.86 11.86 0 0 0 .67 12c0 1.92.46 3.73 1.26 5.34l3.34-3.06Z" transform="translate(0 -.34)" />
      <path fill="#4285F4" d="M12 4.93c1.62 0 3.06.56 4.21 1.64l3.13-3.13C17.45 1.64 14.97.67 12 .67 7.39.67 3.41 3.3 1.6 7.16l3.67 2.56C6.14 6.96 8.82 4.93 12 4.93Z" transform="translate(0 .34)" />
      <path fill="#FBBC05" d="M12 23.33c2.97 0 5.46-.98 7.28-2.66l-3.3-2.56c-.92.62-2.1.98-3.98.98-3.18 0-5.86-2.03-6.73-4.79l-3.67 2.56C3.41 20.7 7.39 23.33 12 23.33Z" />
    </svg>
  )
}

const GLYPHS: Record<PlatformId, () => React.ReactElement> = {
  instagram: Instagram,
  x: X,
  linkedin: LinkedIn,
  facebook: Facebook,
  tiktok: TikTok,
  google: Google,
}

export function BrandLogo({ id }: { id: PlatformId }) {
  const Glyph = GLYPHS[id]
  return <Glyph />
}
