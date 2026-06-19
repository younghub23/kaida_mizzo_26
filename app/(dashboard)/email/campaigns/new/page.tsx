/*
 * Migration SQL for email_campaigns table:
 *
 * create table if not exists public.email_campaigns (
 *   id          uuid primary key default gen_random_uuid(),
 *   user_id     uuid not null references auth.users(id) on delete cascade,
 *   name        text not null,
 *   subject     text not null,
 *   html_body   text not null default '',
 *   status      text not null default 'draft',
 *   created_at  timestamptz not null default now()
 * );
 *
 * alter table public.email_campaigns enable row level security;
 *
 * create policy "Users manage own campaigns"
 *   on public.email_campaigns
 *   for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 */

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import EmailBuilder from '@/components/email/EmailBuilder'
import { createClient } from '@/lib/supabase/client'
import type { UnlayerEditor } from '@unlayer/types'

export default function NewCampaignPage() {
  const router = useRouter()
  const editorRef = useRef<UnlayerEditor | null>(null)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveDraft() {
    if (!name.trim() || !subject.trim()) {
      toast.error('Campaign name and subject are required.')
      return
    }

    setSaving(true)

    const htmlBody = await new Promise<string>((resolve) => {
      if (!editorRef.current) {
        resolve('')
        return
      }
      editorRef.current.exportHtml((data) => {
        resolve(data.html ?? '')
      })
    })

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in.')
        return
      }

      const { error } = await supabase.from('email_campaigns').insert({
        user_id: user.id,
        name: name.trim(),
        subject: subject.trim(),
        html_body: htmlBody,
        status: 'draft',
      })

      if (error) {
        toast.error('Failed to save draft.')
        return
      }

      toast.success('Draft saved!')
      router.push('/email')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/email" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back to Email Campaigns
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">New Campaign</h1>
        </div>
        <Button onClick={saveDraft} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
      </div>

      <div className="grid gap-4 max-w-xl">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            placeholder="Summer Sale Announcement"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            placeholder="Don't miss our biggest sale of the year!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Email Body</Label>
        <EmailBuilder onReady={(editor) => { editorRef.current = editor }} />
      </div>
    </div>
  )
}
