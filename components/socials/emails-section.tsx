'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Mail, Users, Calendar, Clock, Loader2, Link2, Lock, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveEmail, type EmailActionState } from '@/app/actions/email'
import { TIMEZONES } from '@/lib/socials/platforms'

const INITIAL: EmailActionState = { error: null, success: false }
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Added manually',
  purchase: 'Customers (purchases)',
  signup: 'Sign-ups',
  newsletter: 'Newsletter',
  website: 'Website',
}

export function EmailsSection({
  canSync,
  contactCount,
  sources,
}: {
  canSync: boolean
  contactCount: number
  sources: string[]
}) {
  const [state, formAction, isPending] = useActionState(saveEmail, INITIAL)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('all')
  const [date, setDate] = useState('')
  const [hour, setHour] = useState('09')
  const [minute, setMinute] = useState('00')
  const [timezone, setTimezone] = useState<string>(TIMEZONES[0].value)
  const [intent, setIntent] = useState<'draft' | 'schedule' | 'send'>('send')

  useEffect(() => {
    if (state.success) {
      const msg =
        intent === 'draft'
          ? 'Email saved to drafts'
          : intent === 'schedule'
            ? 'Email scheduled'
            : `Email sent to ${state.count ?? 0} contacts`
      toast.success(msg)
      if (intent !== 'draft') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSubject('')
        setBody('')
      }
    } else if (state.error) {
      toast.error(state.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Mail className="size-5" />
        <h2 className="text-xl font-semibold">Emails</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* composer */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Compose email</CardTitle>
            <CardDescription>Write, schedule, or send a campaign to your list.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your subject line"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="body">Message</Label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Write your email…"
                  className="w-full resize-none rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Send to</Label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="all">Entire list ({contactCount})</option>
                    {sources.map((s) => (
                      <option key={s} value={s}>
                        {SOURCE_LABELS[s] ?? s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1 text-xs"><Calendar className="size-3" /> Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1 text-xs"><Clock className="size-3" /> Time</Label>
                  <div className="flex items-center gap-1.5">
                    <select value={hour} onChange={(e) => setHour(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
                      {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    :
                    <select value={minute} onChange={(e) => setMinute(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
                      {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Timezone</Label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
                    {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </div>
              </div>

              <input type="hidden" name="subject" value={subject} />
              <input type="hidden" name="body" value={body} />
              <input type="hidden" name="audience" value={audience} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="time" value={`${hour}:${minute}`} />
              <input type="hidden" name="timezone" value={timezone} />
              <input type="hidden" name="intent" value={intent} />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" formAction={formAction} disabled={isPending} onClick={() => setIntent('send')}>
                  {isPending && intent === 'send' ? <Loader2 className="size-4 animate-spin" /> : 'Send now'}
                </Button>
                <Button type="submit" variant="outline" formAction={formAction} disabled={isPending} onClick={() => setIntent('schedule')}>
                  {isPending && intent === 'schedule' ? <Loader2 className="size-4 animate-spin" /> : 'Schedule'}
                </Button>
                <Button type="submit" variant="ghost" formAction={formAction} disabled={isPending} onClick={() => setIntent('draft')}>
                  {isPending && intent === 'draft' ? <Loader2 className="size-4 animate-spin" /> : 'Save draft'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* email list + sync */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="size-4" /> Email list</CardTitle>
              <CardDescription>{contactCount} contacts</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/socials/emails/list">
                  Manage list
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              {canSync ? (
                <Button asChild className="w-full justify-between">
                  <Link href="/socials/emails/connect">
                    <span className="flex items-center gap-1.5"><Link2 className="size-4" /> Connect your website</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Lock className="size-3.5" /> Auto-sync from your website
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Automatically add contacts when people buy or sign up on your site. Available on
                    Pro and Agency.
                  </p>
                  <Button asChild size="sm" variant="secondary" className="mt-2.5 w-full">
                    <Link href="/plan">Upgrade plan</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
