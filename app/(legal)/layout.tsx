import Link from 'next/link'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FBF0CE]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-fredoka)] text-3xl font-bold lowercase text-[#C13A77]"
        >
          tala
        </Link>
        <Link
          href="/login"
          className="font-[family-name:var(--font-fredoka)] text-xs uppercase tracking-[0.2em] text-[#C13A77] hover:opacity-75"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">{children}</main>

      <footer className="mx-auto max-w-3xl px-6 pb-16">
        <div className="flex gap-5 border-t border-[#C13A77]/30 pt-6 font-[family-name:var(--font-fredoka)] text-xs uppercase tracking-[0.2em] text-[#C13A77]">
          <Link href="/terms" className="hover:opacity-75">
            Terms
          </Link>
          <Link href="/privacy" className="hover:opacity-75">
            Privacy
          </Link>
          <Link href="/login" className="hover:opacity-75">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
