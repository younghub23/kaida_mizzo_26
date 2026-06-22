import { Database, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Small, consistent "Source:" caption shown on every analytics widget so it is
 * always obvious where the data will eventually come from. While Tala has no
 * live integrations, every label ends with "(mock)".
 */
export function DataSource({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
        className
      )}
    >
      <Database className="size-3 shrink-0" />
      Source: {label}
    </span>
  )
}

/** Page-level banner making it unmistakable that the whole page is demo data. */
export function DemoBanner() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-semibold">Demo data</span> — these analytics are
        placeholders and not connected to live integrations yet. Each section
        notes where its real data will come from.
      </p>
    </div>
  )
}

/** Section wrapper: title, optional description, a Source badge, and content. */
export function Section({
  title,
  description,
  source,
  icon: Icon,
  action,
  children,
}: {
  title: string
  description?: string
  source: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-4 text-muted-foreground" />}
            <h2 className="text-lg font-semibold font-heading">{title}</h2>
            <DataSource label={source} />
          </div>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
