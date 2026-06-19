import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'

type ContactRow = { name: string; email: string }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { contacts?: ContactRow[] }
    const contacts = body.contacts

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'contacts array is required' }, { status: 400 })
    }

    const rows = contacts
      .filter((c) => c.email && c.email.includes('@'))
      .map((c) => ({
        user_id: user.id,
        name: c.name?.trim() ?? '',
        email: c.email.trim().toLowerCase(),
        subscribed: true,
      }))

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('contacts')
      .upsert(rows, { onConflict: 'user_id,email' })

    if (error) {
      logError('email/import-contacts', 'Failed to upsert contacts', error)
      return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 })
    }

    return NextResponse.json({ imported: rows.length })
  } catch (err) {
    logError('email/import-contacts', 'Unexpected error', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
