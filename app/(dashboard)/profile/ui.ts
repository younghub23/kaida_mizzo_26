// Shared Tala "warm" presentation tokens for the Profile/Settings area.
// These are class-name strings only (no logic) so they can be imported by both
// server and client components. They mirror the reference treatment shipped in
// app/(dashboard)/dashboard/page.tsx so the Profile area reads as the same
// editorial, paper-and-ink family.

// Micro-label header style (uppercase, tracked-out, accent-colored).
export const microLabel =
  'text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary'

// Form-field label: the micro-label face, sized up a touch for a tappable
// label that still reads as the same warm eyebrow above each input.
export const fieldLabel =
  'text-[11px] font-semibold uppercase tracking-[0.14em] text-primary'

// Warm text-control recipe (inputs / textareas / native selects) — soft radius
// plus the gentle warm focus ring used by the Socials composer. Mirrors the
// .profile-warm form-control selectors so controls styled inline match.
export const fieldControl =
  'border border-input bg-transparent text-sm outline-none transition-colors focus-visible:border-[#a48d78] focus-visible:ring-[3px] focus-visible:ring-[rgba(164,141,120,.15)] dark:bg-input/30'

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
export type ChipPalette = { bg: string; border: string; text: string }

export const chipPalettes: ChipPalette[] = [
  { bg: '#F9E4EE', border: 'rgba(214,73,140,.35)', text: '#A82C66' }, // bougainvillea
  { bg: '#FBF0D2', border: 'rgba(244,201,109,.5)', text: '#9A6E16' }, // lemon
  { bg: '#DCF1F2', border: 'rgba(54,183,192,.45)', text: '#1E7B82' }, // turquoise
  { bg: '#E4F0F8', border: 'rgba(154,198,224,.55)', text: '#3A6E92' }, // sky
  { bg: '#FBE7E0', border: 'rgba(240,176,160,.55)', text: '#B5604A' }, // blush
  { bg: '#EAE3D6', border: 'rgba(164,141,120,.45)', text: '#8A715C' }, // soft brown
]
