// Lightweight, dependency-free charts. Pure SVG/CSS so we don't pull in a
// charting library. All inputs are plain numbers; rendering is deterministic.
import { cn } from '@/lib/utils'

type Series = { label: string; color: string; values: number[] }

/**
 * Responsive multi-series line chart with a faint area fill on the first
 * series. Uses a 0..100 viewBox with non-uniform scaling so it stretches to
 * its container width.
 */
export function LineChart({
  labels,
  series,
  height = 180,
  className,
}: {
  labels: string[]
  series: Series[]
  height?: number
  className?: string
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.values))
  const n = Math.max(1, labels.length - 1)
  const x = (i: number) => (i / n) * 100
  const y = (v: number) => 100 - (v / max) * 100

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`Trend chart: ${series.map((s) => s.label).join(', ')}`}
      >
        {[25, 50, 75].map((g) => (
          <line key={g} x1="0" x2="100" y1={g} y2={g} className="stroke-border" strokeWidth="0.3" />
        ))}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
          return (
            <g key={s.label}>
              {si === 0 && (
                <polygon
                  points={`0,100 ${pts} 100,100`}
                  fill={s.color}
                  opacity={0.08}
                />
              )}
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{labels[0]}</span>
        <span>{labels[Math.floor(labels.length / 2)]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Horizontal labeled bar (for distributions: locations, ages, share of voice). */
export function BarRow({
  label,
  value,
  max,
  suffix = '%',
  color = 'var(--chart-2)',
}: {
  label: string
  value: number
  max: number
  suffix?: string
  color?: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-muted-foreground">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-12 shrink-0 text-right tabular-nums">
        {value}
        {suffix}
      </span>
    </div>
  )
}

/**
 * Vertical mini bar chart (monthly follower growth). Pass `colors` to tint each
 * column from a cycling palette (used to spread the full Tala accent set across
 * the bars); otherwise every column uses the single `color`.
 */
export function ColumnChart({
  data,
  height = 120,
  color = 'var(--chart-3)',
  colors,
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  colors?: readonly string[]
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    // `items-stretch` so each column fills the chart height — the bars'
    // percentage heights resolve against it (otherwise columns shrink to their
    // label and the bars collapse to zero).
    <div className="flex items-stretch gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t"
            style={{
              height: `${(d.value / max) * 100}%`,
              backgroundColor: colors && colors.length ? colors[i % colors.length] : color,
            }}
            title={`${d.label}: ${d.value.toLocaleString()}`}
          />
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
