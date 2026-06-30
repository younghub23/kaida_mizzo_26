import Link from 'next/link'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="tala-theme min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="flex size-8 items-center justify-center rounded-[9px] font-fredoka text-[17px] font-bold text-white shadow-[0_2px_8px_rgba(214,72,140,.3)]"
              style={{ background: 'linear-gradient(135deg,#D6488C,#E08A3C)' }}
              aria-hidden="true"
            >
              t
            </span>
            <span className="font-fredoka text-[22px] font-semibold lowercase text-foreground">
              tala
            </span>
          </Link>
          <Link
            href="/login"
            className="font-fredoka text-xs font-medium uppercase tracking-[0.2em] text-primary transition-colors hover:text-[#8A715C]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">{children}</main>

      <footer className="mx-auto max-w-3xl px-6 pb-16">
        <div className="flex gap-5 border-t border-border pt-6 font-fredoka text-xs font-medium uppercase tracking-[0.2em] text-primary">
          <Link href="/terms" className="transition-colors hover:text-[#8A715C]">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-[#8A715C]">
            Privacy
          </Link>
          <Link href="/login" className="transition-colors hover:text-[#8A715C]">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
