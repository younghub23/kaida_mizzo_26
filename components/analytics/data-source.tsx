import Link from 'next/link'
import { Database, TriangleAlert, PlugZap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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

/**
 * Page-level banner.
 *  - Production (allowMock=false): real data only. Explains live sources or, if
 *    nothing is connected, prompts to connect an account.
 *  - Development (allowMock=true): clarifies the page is showing mock/demo data.
 */
export function DemoBanner({
  livePlatforms = [],
  allowMock,
}: {
  livePlatforms?: string[]
  allowMock: boolean
}) {
  const isLive = livePlatforms.length > 0

  if (!allowMock) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
        <PlugZap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        {isLive ? (
          <p>
            Showing <span className="font-semibold">live data</span> from{' '}
            {livePlatforms.join(', ')}. Sections without a connected source stay
            empty until you connect them.
          </p>
        ) : (
          <p>
            <span className="font-semibold">No connected accounts yet.</span>{' '}
            Connect a social account to start seeing your analytics —{' '}
            <Link href="/social/connect" className="font-medium underline underline-offset-2">
              connect now
            </Link>
            .
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      {isLive ? (
        <p>
          <span className="font-semibold">Partially live (dev)</span> — pulling
          real data from {livePlatforms.join(', ')}; other sections show{' '}
          <span className="font-medium">(mock)</span> placeholders.
        </p>
      ) : (
        <p>
          <span className="font-semibold">Demo data (dev)</span> — showing mock
          placeholders. On the live site only real data is shown. Each section
          notes its source.
        </p>
      )}
    </div>
  )
}

/** Shown in place of a section's content when there's no connected data source. */
export function EmptyState({
  message = 'Not connected yet — connect an account to see this.',
}: {
  message?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-9 items-center justify-center rounded-full bg-muted">
          <PlugZap className="size-4 text-muted-foreground" />
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/social/connect">Connect an account</Link>
        </Button>
      </CardContent>
    </Card>
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
