import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isCreator } from '@/lib/account'

// Route access by account type. Business users own the marketing tools;
// creators own only the marketplace experience. Keep both lists here so the
// gating is easy to audit and extend. Each entry matches the path itself and
// any sub-route (e.g. '/socials' also covers '/socials/connect').
const BUSINESS_ONLY_PREFIXES = ['/calendar', '/socials', '/analytics', '/ai']
const CREATOR_ONLY_PREFIXES = ['/marketplace', '/messages']

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public / server-to-server endpoints that authenticate themselves and must
  // be reachable without a user session: Stripe webhooks (signature-verified),
  // the website contact-ingestion API (API-key auth), and the scheduled-post
  // publish endpoints (service-role, idempotent). Without this, the auth
  // redirect below would bounce these to /login.
  const isPublicApi =
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/api/social/publish')

  if (
    !user &&
    !isPublicApi &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/signup') &&
    !pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Account-type route gating: creators can't reach business-only tools, and
  // business users can't reach the (creator-only) marketplace/messages areas.
  // Both bounce to the shared dashboard, which renders the right experience.
  if (user) {
    const creator = isCreator(user)
    const blocked = creator
      ? matchesPrefix(pathname, BUSINESS_ONLY_PREFIXES)
      : matchesPrefix(pathname, CREATOR_ONLY_PREFIXES)
    if (blocked) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
