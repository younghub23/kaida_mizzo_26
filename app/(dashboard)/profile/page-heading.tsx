// Warm page heading for the Profile subpages — Fredoka title + DM-Serif italic
// subtitle, matching the dashboard greeting type. Presentation only.
export function PageHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div>
      <h1 className="font-fredoka text-[28px] font-semibold leading-[1.05] tracking-[-0.01em]">
        {title}
      </h1>
      <p className="mt-1.5 font-dm-serif text-lg italic text-muted-foreground">
        {subtitle}
      </p>
    </div>
  )
}
