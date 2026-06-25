import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addContact, type ContactSource } from '@/lib/email/contacts'
import { getPlanForUser } from '@/lib/plan/server'
import { canUseWebsiteSync } from '@/lib/analytics/plan'
import { logError } from '@/lib/log'

// Public, internet-facing endpoint. The user's website (or a no-code tool, or
// their store's Stripe webhook) POSTs new contacts here, authenticated by the
// per-user ingest key. Gated to Pro/Agency — enforced server-side here, not
// just hidden in the UI.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

function readKey(req: NextRequest, body: Record<string, unknown>): string | null {
  const header = req.headers.get('x-api-key')
  if (header) return header
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const url = new URL(req.url)
  const q = url.searchParams.get('key')
  if (q) return q
  if (typeof body.key === 'string') return body.key
  return null
}

// Pull an email (+ optional name) from either a plain payload or a
// Stripe-shaped checkout/customer event, so the same URL works for both the
// embed snippet and a store's Stripe webhook.
function extract(body: Record<string, unknown>): { email?: string; name?: string; source: ContactSource } {
  if (typeof body.email === 'string') {
    return {
      email: body.email,
      name: typeof body.name === 'string' ? body.name : undefined,
      source: (typeof body.source === 'string' ? body.source : 'website') as ContactSource,
    }
  }
  // Stripe event shape: { type, data: { object: {...} } }
  const data = body.data as { object?: Record<string, unknown> } | undefined
  const obj = data?.object
  if (obj) {
    const details = obj.customer_details as { email?: string; name?: string } | undefined
    const email = (obj.email as string) || details?.email
    const name = (obj.name as string) || details?.name
    if (email) return { email, name, source: 'purchase' }
  }
  return { source: 'website' }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  const key = readKey(req, body)
  if (!key) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401, headers: CORS })
  }

  const admin = createAdminClient()
  const { data: keyRow } = await admin
    .from('ingest_keys')
    .select('user_id')
    .eq('token', key)
    .maybeSingle()

  if (!keyRow) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: CORS })
  }

  const userId = keyRow.user_id as string

  // Plan gate — Pro/Agency only.
  const plan = await getPlanForUser(userId)
  if (!canUseWebsiteSync(plan)) {
    return NextResponse.json(
      { error: 'Website sync requires the Pro or Agency plan' },
      { status: 402, headers: CORS }
    )
  }

  const { email, name, source } = extract(body)
  if (!email) {
    return NextResponse.json({ error: 'No email found in payload' }, { status: 400, headers: CORS })
  }

  const ok = await addContact({ userId, email, name, source })
  if (!ok) {
    logError('public/contacts', 'addContact failed', undefined, { userId })
    return NextResponse.json({ error: 'Invalid email' }, { status: 400, headers: CORS })
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: CORS })
}
