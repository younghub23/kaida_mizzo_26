import { ProfileNav } from './profile-nav'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Opt the whole Profile area into the warm Tala palette. The `tala-theme`
  // class remaps the shadcn tokens (bg-card, text-muted-foreground, border,
  // primary, ring, …) to the cream-and-ink values for every subpage below.
  return (
    <div className="profile-warm tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:gap-10">
          <ProfileNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
