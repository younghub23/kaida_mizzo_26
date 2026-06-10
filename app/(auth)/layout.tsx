export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <span className="font-heading text-2xl font-semibold tracking-tight">
        Tala
      </span>
      {children}
    </div>
  )
}
