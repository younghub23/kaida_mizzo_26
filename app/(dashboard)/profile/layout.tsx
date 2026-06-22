import { ProfileNav } from './profile-nav'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        <ProfileNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
