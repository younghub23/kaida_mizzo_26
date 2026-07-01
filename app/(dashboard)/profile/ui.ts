// Shared Tala "warm" presentation tokens for the Profile/Settings area.
// These are class-name strings only (no logic) so they can be imported by both
// server and client components. They mirror the reference treatment shipped in
// app/(dashboard)/dashboard/page.tsx so the Profile area reads as the same
// editorial, paper-and-ink family.

// Micro-label header style (uppercase, tracked-out, accent-colored).
export const microLabel =
  'text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary'

// Warm card surface: 14px radius, hairline border, an inset top highlight.
export const card =
  'rounded-[14px] border border-border bg-card shadow-[0_1px_0_rgba(255,255,255,.6)_inset]'

// Gentle hover lift for interactive cards/tiles.
export const cardLink =
  'transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]'

// The brand action gradient (pink → rust → tangerine) for solid CTAs.
export const brandGradient = 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)'

// Rotating category palette (bg tint / border / text) for colorful icon chips —
// matches the calendar category colors so the area reads warm and varied.
export const chipPalettes: { bg: string; border: string; text: string }[] = [
  { bg: '#F9E4EE', border: 'rgba(214,73,140,.35)', text: '#A82C66' }, // bougainvillea
  { bg: '#FBF0D2', border: 'rgba(244,201,109,.5)', text: '#9A6E16' }, // lemon
  { bg: '#DCF1F2', border: 'rgba(54,183,192,.45)', text: '#1E7B82' }, // turquoise
  { bg: '#E4F0F8', border: 'rgba(154,198,224,.55)', text: '#3A6E92' }, // sky
  { bg: '#FBE7E0', border: 'rgba(240,176,160,.55)', text: '#B5604A' }, // blush
  { bg: '#EAE3D6', border: 'rgba(164,141,120,.45)', text: '#8A715C' }, // soft brown
]

// Per-section icon-tile palette (soft tint + stroked-glyph color). One key per
// Profile route so the overview rows and each sub-page's icon tiles tell the
// same color story — Brand blush, Wallet amber, Security turquoise, Password
// sky, Linked rust, Privacy soft-brown. Mirrors the static mockup's tile tints.
export type SectionKey =
  | 'brand'
  | 'creator'
  | 'wallet'
  | 'security'
  | 'password'
  | 'linked'
  | 'privacy'

export const sectionTiles: Record<SectionKey, { bg: string; icon: string }> = {
  brand: { bg: '#F9E4EE', icon: '#D6498C' },
  creator: { bg: '#F9E4EE', icon: '#D6498C' },
  wallet: { bg: '#FBF0D2', icon: '#D99A2E' },
  security: { bg: '#DCF1F2', icon: '#36B7C0' },
  password: { bg: '#E4F0F8', icon: '#5B9BD0' },
  linked: { bg: '#FBE7E0', icon: '#C8472E' },
  privacy: { bg: '#EAE3D6', icon: '#A48D78' },
}
