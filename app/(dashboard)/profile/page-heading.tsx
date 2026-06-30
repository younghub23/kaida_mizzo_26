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
      <h1 className="font-fredoka text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] max-[820px]:text-[28px]">
        {title}
      </h1>
      <p className="mt-2 font-dm-serif text-[19px] italic text-primary">
        {subtitle}
      </p>
    </div>
  )
}
