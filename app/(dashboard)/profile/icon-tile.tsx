import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sectionTiles, type SectionKey } from './ui'

// Soft category-tinted icon tile — a rounded square with a section-colored
// stroked glyph. Shared by the overview section rows and each sub-page so the
// whole Profile area reads as one warm family. Presentation only.
export function IconTile({
  section,
  icon: Icon,
  className,
  iconClassName,
}: {
  section: SectionKey
  icon: LucideIcon
  className?: string
  iconClassName?: string
}) {
  const tile = sectionTiles[section]
  return (
    <span
      className={cn(
        'flex size-13 shrink-0 items-center justify-center rounded-[14px]',
        className
      )}
      style={{ background: tile.bg, color: tile.icon }}
    >
      <Icon
        className={cn('size-[25px]', iconClassName)}
        strokeWidth={1.7}
        aria-hidden
      />
    </span>
  )
}
