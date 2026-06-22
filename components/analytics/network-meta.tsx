import { Camera, Megaphone, Briefcase, Music2, Search } from 'lucide-react'
import type { RealNetwork } from '@/app/(dashboard)/analytics/mock-data'

export const NETWORK_LABEL: Record<RealNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  google: 'Google',
}

// This lucide-react version dropped brand logos (trademark policy), so we use
// neutral stand-in glyphs per network.
export const NETWORK_ICON: Record<RealNetwork, React.ComponentType<{ className?: string }>> = {
  instagram: Camera,
  facebook: Megaphone,
  linkedin: Briefcase,
  tiktok: Music2,
  google: Search,
}
