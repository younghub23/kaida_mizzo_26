'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logError } from '@/lib/log'
import { isValidEmail, type ContactSource } from '@/lib/email/contacts'
import { zonedToUtcIso } from '@/lib/socials/schedule'

export type Contact = {
  id: string
  email: string
  name: string
  source: string
  subscribed: boolean
  created_at: string
}

export type EmailActionState = { error: string | null; success: boolean; count?: number }

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// ---------------------------------------------------------------------------
// Contacts (the email list)
// ---------------------------------------------------------------------------
export async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient()
  const user = await requireUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('contacts')
    .select('id, email, name, source, subscribed, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    if (error) logError('email/getContacts', 'Failed to fetch contacts', error, { userId: user.id })
    return []
  }
  return data as Contact[]
}

/** Parse a pasted/typed blob into {name, email} rows. (local helper) */
function parsePastedContacts(raw: string): { name: string; email: string }[] {
  const out: { name: string; email: string }[] = []
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const angle = trimmed.match(/^(.*)<([^>]+)>\s*$/)
    if (angle) {
      out.push({ name: angle[1].trim().replace(/[,;]$/, ''), email: angle[2].trim() })
      continue
    }

    const parts = trimmed.split(/[,;\t]+/).map((s) => s.trim()).filter(Boolean)
    const emailPart = parts.find((p) => p.includes('@'))
    if (emailPart) {
      const name = parts.filter((p) => p !== emailPart).join(' ')
      out.push({ name, email: emailPart })
      continue
    }
    for (const token of trimmed.split(/\s+/)) {
      if (token.includes('@')) out.push({ name: '', email: token })
    }
  }
  return out
}

export async function addContactsBulk(
  _prev: EmailActionState,
  formData: FormData
): Promise<EmailActionState> {
  const user = await requireUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const raw = (formData.get('contacts') as string) ?? ''
  const parsed = parsePastedContacts(raw)

  const seen = new Set<string>()
  const rows = parsed
    .map((c) => ({ name: c.name, email: c.email.toLowerCase() }))
    .filter((c) => isValidEmail(c.email))
    .filter((c) => (seen.has(c.email) ? false : (seen.add(c.email), true)))
    .map((c) => ({
      user_id: user.id,
      email: c.email,
      name: c.name,
      source: 'manual' as ContactSource,
      subscribed: true,
    }))

  if (rows.length === 0) {
    return { error: 'No valid email addresses found', success: false }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('contacts').upsert(rows, { onConflict: 'user_id,email' })
  if (error) {
    logError('email/addContactsBulk', 'Upsert failed', error, { userId: user.id })
    return { error: 'Failed to save contacts', success: false }
  }

  revalidatePath('/socials/emails/list')
  return { error: null, success: true, count: rows.length }
}

export async function deleteContact(id: string): Promise<EmailActionState> {
  const supabase = await createClient()
  const user = await requireUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const { error } = await supabase.from('contacts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message, success: false }

  revalidatePath('/socials/emails/list')
  return { error: null, success: true }
}

// ---------------------------------------------------------------------------
// Compose: draft / schedule / send (Resend)
// ---------------------------------------------------------------------------
export async function saveEmail(
  _prev: EmailActionState,
  formData: FormData
): Promise<EmailActionState> {
  const supabase = await createClient()
  const user = await requireUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const subject = ((formData.get('subject') as string) || '').trim()
  const body = ((formData.get('body') as string) || '').trim()
  const audience = (formData.get('audience') as string) || 'all'
  const intent = formData.get('intent') as 'draft' | 'schedule' | 'send'
  const date = (formData.get('date') as string) || ''
  const time = (formData.get('time') as string) || '09:00'
  const timezone = (formData.get('timezone') as string) || 'America/New_York'

  if (intent !== 'draft' && (!subject || !body)) {
    return { error: 'Add a subject and body before sending', success: false }
  }

  // Resolve recipients from the email list.
  let query = supabase.from('contacts').select('email').eq('user_id', user.id).eq('subscribed', true)
  if (audience !== 'all') query = query.eq('source', audience)
  const { data: contacts } = await query
  const recipients = (contacts ?? []).map((c) => c.email)

  if (intent === 'send' && recipients.length === 0) {
    return { error: 'No contacts to send to. Add some to your email list first.', success: false }
  }

  const sendAt =
    intent === 'send'
      ? new Date().toISOString()
      : date
        ? zonedToUtcIso(date, time, timezone)
        : intent === 'schedule'
          ? null
          : new Date().toISOString()

  if (intent === 'schedule' && !sendAt) {
    return { error: 'Pick a date and time to schedule this email', success: false }
  }

  const status = intent === 'draft' ? 'draft' : intent === 'schedule' ? 'scheduled' : 'sent'

  // Attempt the actual send for "send now".
  if (intent === 'send') {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM
    if (!apiKey || !from) {
      return {
        error: 'Email sending is not configured yet (set RESEND_API_KEY and EMAIL_FROM).',
        success: false,
      }
    }
    try {
      const resend = new Resend(apiKey)
      // Send in BCC chunks of 50 so recipients don't see each other.
      for (let i = 0; i < recipients.length; i += 50) {
        const chunk = recipients.slice(i, i + 50)
        const { error } = await resend.emails.send({
          from,
          to: [from],
          bcc: chunk,
          subject,
          text: body,
        })
        if (error) throw new Error(error.message)
      }
    } catch (err) {
      logError('email/saveEmail', 'Resend send failed', err, { userId: user.id })
      return { error: 'Failed to send email. Check your Resend configuration.', success: false }
    }
  }

  const { error } = await supabase.from('scheduled_emails').insert({
    user_id: user.id,
    subject,
    body,
    audience,
    send_at: sendAt ?? new Date().toISOString(),
    status,
    recipient_count: recipients.length,
  })
  if (error) {
    logError('email/saveEmail', 'Failed to save email record', error, { userId: user.id })
    return { error: error.message, success: false }
  }

  revalidatePath('/socials')
  return {
    error: null,
    success: true,
    count: intent === 'send' ? recipients.length : undefined,
  }
}

// ---------------------------------------------------------------------------
// Ingest key (website sync) — Pro/Agency
// ---------------------------------------------------------------------------
export async function getIngestKey(): Promise<string | null> {
  const supabase = await createClient()
  const user = await requireUser()
  if (!user) return null

  const { data } = await supabase.from('ingest_keys').select('token').eq('user_id', user.id).maybeSingle()
  return data?.token ?? null
}

export async function regenerateIngestKey(): Promise<{ token: string | null; error: string | null }> {
  const user = await requireUser()
  if (!user) return { token: null, error: 'Unauthorized' }

  const token = `tala_${crypto.randomUUID().replace(/-/g, '')}`
  const admin = createAdminClient()
  const { error } = await admin
    .from('ingest_keys')
    .upsert({ user_id: user.id, token }, { onConflict: 'user_id' })

  if (error) {
    logError('email/regenerateIngestKey', 'Failed to upsert key', error, { userId: user.id })
    return { token: null, error: 'Failed to generate key' }
  }
  revalidatePath('/socials/emails/connect')
  return { token, error: null }
}
