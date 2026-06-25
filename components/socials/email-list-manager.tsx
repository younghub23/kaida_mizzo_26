'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Trash2, Search, Plus, Link2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addContactsBulk, deleteContact, type Contact, type EmailActionState } from '@/app/actions/email'

const INITIAL: EmailActionState = { error: null, success: false }

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  purchase: 'Purchase',
  signup: 'Sign-up',
  newsletter: 'Newsletter',
  website: 'Website',
}

export function EmailListManager({
  initialContacts,
  canSync,
}: {
  initialContacts: Contact[]
  canSync: boolean
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(addContactsBulk, INITIAL)
  const [raw, setRaw] = useState('')
  const [query, setQuery] = useState('')
  const [contacts, setContacts] = useState(initialContacts)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContacts(initialContacts)
  }, [initialContacts])

  useEffect(() => {
    if (state.success) {
      toast.success(`Added ${state.count ?? 0} contacts`)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRaw('')
      router.refresh()
    } else if (state.error) {
      toast.error(state.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const filtered = contacts.filter(
    (c) =>
      c.email.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
  )

  async function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    const res = await deleteContact(id)
    if (!res.success) {
      toast.error(res.error ?? 'Failed to delete')
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Link href="/socials" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Socials
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Email list</h1>
            <p className="text-sm text-muted-foreground">{contacts.length} contacts</p>
          </div>
          {canSync && (
            <Button asChild variant="outline" className="gap-2">
              <Link href="/socials/emails/connect">
                <Link2 className="size-4" />
                Connect your website
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* manual add — every plan */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="size-4" /> Add contacts</CardTitle>
            <CardDescription>
              Type or paste emails — one per line, or comma-separated. “Name &lt;email&gt;” works too.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contacts">Emails</Label>
                <textarea
                  id="contacts"
                  name="contacts"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  rows={8}
                  placeholder={'jane@example.com\nJohn Doe <john@example.com>\nsam@example.com, Sam Lee'}
                  className="w-full resize-none rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <Button type="submit" formAction={formAction} disabled={isPending || !raw.trim()}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Add to list'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* list */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts…"
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {contacts.length === 0 ? 'No contacts yet.' : 'No matches.'}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {filtered.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.email}</p>
                      {c.name && <p className="truncate text-xs text-muted-foreground">{c.name}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {SOURCE_LABELS[c.source] ?? c.source}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
