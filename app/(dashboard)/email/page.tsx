/*
 * Migration SQL for contacts table:
 *
 * create table if not exists public.contacts (
 *   id          uuid primary key default gen_random_uuid(),
 *   user_id     uuid not null references auth.users(id) on delete cascade,
 *   name        text not null default '',
 *   email       text not null,
 *   subscribed  boolean not null default true,
 *   created_at  timestamptz not null default now(),
 *   unique (user_id, email)
 * );
 *
 * alter table public.contacts enable row level security;
 *
 * create policy "Users manage own contacts"
 *   on public.contacts
 *   for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PlusCircle, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'

type Contact = {
  id: string
  name: string
  email: string
  subscribed: boolean
  created_at: string
}

type Campaign = {
  id: string
  name: string
  subject: string
  status: string
  created_at: string
}

type ParsedContact = { name: string; email: string }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function EmailPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [csvPreview, setCsvPreview] = useState<ParsedContact[]>([])
  const [allParsed, setAllParsed] = useState<ParsedContact[]>([])
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: c }, { data: camp }] = await Promise.all([
        supabase.from('contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('email_campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      if (c) setContacts(c)
      if (camp) setCampaigns(camp)
    }
    load()
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split(/\r?\n/).filter(Boolean)
      // Detect header row
      const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0
      const parsed: ParsedContact[] = lines.slice(startIndex).map((line) => {
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        const name = cols[0] ?? ''
        const email = cols[1] ?? cols[0] ?? ''
        return { name, email }
      }).filter((c) => c.email.includes('@'))

      setAllParsed(parsed)
      setCsvPreview(parsed.slice(0, 5))
    }
    reader.readAsText(file)
  }

  async function confirmImport() {
    if (allParsed.length === 0) return
    setImporting(true)
    try {
      const res = await fetch('/api/email/import-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: allParsed }),
      })
      const data = (await res.json()) as { imported?: number; error?: string }

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Import failed')
        return
      }

      toast.success(`Imported ${data.imported} contact(s)`)
      setUploadOpen(false)
      setCsvPreview([])
      setAllParsed([])
      if (fileRef.current) fileRef.current.value = ''

      // Refresh contacts
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: c } = await supabase.from('contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        if (c) setContacts(c)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Email Campaigns</h1>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{contacts.length} contact(s)</p>
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="size-4 mr-2" />
              Upload Contacts
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No contacts yet. Upload a CSV to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name || '—'}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{formatDate(c.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={c.subscribed ? 'default' : 'secondary'}>
                          {c.subscribed ? 'Subscribed' : 'Unsubscribed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{campaigns.length} campaign(s)</p>
            <Button asChild size="sm">
              <Link href="/email/campaigns/new">
                <PlusCircle className="size-4 mr-2" />
                New Campaign
              </Link>
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No campaigns yet. Create your first one.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((camp) => (
                    <TableRow key={camp.id}>
                      <TableCell className="font-medium">{camp.name}</TableCell>
                      <TableCell>{camp.subject}</TableCell>
                      <TableCell>
                        <Badge variant={camp.status === 'sent' ? 'default' : 'secondary'}>
                          {camp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(camp.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Contacts Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Contacts</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: <strong>name, email</strong>. The first row may be a header.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="text-sm"
            />

            {csvPreview.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 text-muted-foreground">
                  Preview (first 5 of {allParsed.length} rows):
                </p>
                <div className="rounded-md border text-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.name || '—'}</TableCell>
                          <TableCell>{row.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); setCsvPreview([]); setAllParsed([]) }}>
              Cancel
            </Button>
            <Button onClick={confirmImport} disabled={allParsed.length === 0 || importing}>
              {importing ? 'Importing…' : `Import ${allParsed.length} Contact(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
