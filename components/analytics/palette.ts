import type { RealNetwork } from '@/app/(dashboard)/analytics/mock-data'

// The Tala brand accent palette — the "On every color" swatches. Charts and
// network glyphs draw from these so analytics reads as part of the warm,
// colorful Tala family instead of the default grayscale.
export const ACCENTS = [
  '#D6488C', // bougainvillea
  '#36B6C0', // turquoise
  '#9AC6E0', // sky blue
  '#EFB0A0', // blush pink
  '#F4C96D', // lemon gold
  '#6E8F4E', // vine green
  '#E8843F', // sunset orange
  '#F0A868', // apricot
  '#C8432E', // tomato red
  '#A33028', // amalfi red
] as const

// One accent per network, so a channel reads consistently wherever it appears.
// Chosen so that — together with the five chart tokens (sky, turquoise, vine
// green, sunset orange, bougainvillea) — every accent in the palette is used
// somewhere on the page.
export const NETWORK_COLOR: Record<RealNetwork, string> = {
  instagram: '#D6488C', // bougainvillea
  facebook: '#36B6C0', // turquoise
  linkedin: '#9AC6E0', // sky blue
  pinterest: '#EFB0A0', // blush pink
  snapchat: '#F4C96D', // lemon gold
  google: '#F0A868', // apricot
  tiktok: '#C8432E', // tomato red
  youtube: '#A33028', // amalfi red
}
