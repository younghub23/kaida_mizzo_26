// Circular match-score indicator — a gradient donut with the percentage in the
// center. Presentation only; the score is computed in lib/match.ts from real
// profile overlap. Pure SVG so it renders in server components.
export function MatchRing({
  score,
  size = 44,
  strokeWidth = 4,
}: {
  score: number
  size?: number
  strokeWidth?: number
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const gradientId = `match-grad-${size}`

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={`${clamped}% match`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D6488C" />
            <stop offset="100%" stopColor="#E08A3C" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-accent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute font-fredoka font-semibold leading-none tabular-nums"
        style={{ fontSize: size * 0.28 }}
      >
        {clamped}
      </span>
    </span>
  )
}
