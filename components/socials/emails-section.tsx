'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Mail, Loader2, Lock, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { saveEmail, type EmailActionState } from '@/app/actions/email'
import { TIMEZONES } from '@/lib/socials/platforms'

const INITIAL: EmailActionState = { error: null, success: false }

// 12-hour labels (value stays 24h "HH" for the saved schedule).
const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString().padStart(2, '0'),
  label: `${((i % 12) || 12).toString().padStart(2, '0')} ${i < 12 ? 'AM' : 'PM'}`,
}))
const MINUTES = ['00', '15', '30', '45']

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Added manually',
  purchase: 'Customers',
  signup: 'Sign-ups',
  newsletter: 'Newsletter',
  website: 'Website',
  instagram: 'Instagram',
  events: 'Events',
}

// Warm pill palette cycled across audience sources.
const SOURCE_COLORS = [
  { bg: '#F9E4EE', dot: '#D6488C', text: '#A82C66' },
  { bg: '#FBF0CE', dot: '#E0A12B', text: '#8A6A16' },
  { bg: '#DCF1F2', dot: '#36B7C0', text: '#1E7B82' },
  { bg: '#E3EEF7', dot: '#5B8FB9', text: '#3A6E92' },
  { bg: '#EAE3D6', dot: '#A48D78', text: '#8A715C' },
]

const labelFor = (name: string) =>
  SOURCE_LABELS[name] ?? name.charAt(0).toUpperCase() + name.slice(1)

export function EmailsSection({
  canSync,
  contactCount,
  sources,
}: {
  canSync: boolean
  contactCount: number
  sources: { name: string; count: number }[]
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
  const [aiOpen, setAiOpen] = useState(false)

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
      {/* section label */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Emails
        </h2>
        <span className="text-sm text-muted-foreground">Reach your audience directly in the inbox</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
        {/* card header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundImage: 'linear-gradient(135deg,#f0b454,#e08a3c)' }}
            >
              <Mail className="size-5" />
            </span>
            <div>
              <h3 className="font-fredoka text-xl font-bold leading-tight">Email campaign</h3>
              <p className="font-dm-serif text-base italic text-muted-foreground">
                Compose a broadcast to your contacts
              </p>
            </div>
          </div>
          <Link
            href="/socials/emails/list"
            className="hidden items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Manage list <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* stats + audience sources */}
        <div className="mt-6 flex flex-wrap items-start gap-x-10 gap-y-5 border-b border-border pb-6">
          <div>
            <p className="font-fredoka text-3xl font-bold leading-none">{contactCount.toLocaleString()}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Contacts
            </p>
          </div>
          <div>
            <p className="font-fredoka text-3xl font-bold leading-none">{sources.length}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Sources
            </p>
          </div>
          {sources.length > 0 && (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Audience sources
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.map((s, i) => {
                  const c = SOURCE_COLORS[i % SOURCE_COLORS.length]
                  return (
                    <span
                      key={s.name}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: c.bg, color: c.text }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: c.dot }} />
                      {labelFor(s.name)} · {s.count}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* composer + sync */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <form className="flex flex-col gap-5">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Body</Label>
                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(214,72,140,.3)] bg-[#F9E4EE] px-3 py-1.5 text-xs font-medium text-[#A82C66] transition-colors hover:bg-[#f6d9e8]"
                >
                  <Sparkles className="size-3.5" />
                  Draft with AI
                </button>
              </div>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                placeholder="Write your email…"
                className="w-full resize-none rounded-xl border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audience">Audience</Label>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                <option value="all">All contacts · {contactCount.toLocaleString()}</option>
                {sources.map((s) => (
                  <option key={s.name} value={s.name}>
                    {labelFor(s.name)} · {s.count}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Schedule</Label>
              <div className="grid gap-3 sm:grid-cols-4">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  aria-label="Hour"
                  className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  aria-label="Minute"
                  className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>:{m}</option>
                  ))}
                </select>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  aria-label="Timezone"
                  className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
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

          {/* website sync */}
          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            {canSync ? (
              <>
                <p className="font-fredoka text-base font-bold">Sync contacts from your website</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Automatically pull new sign-ups and checkout emails straight into your audience.
                </p>
                <Button asChild className="mt-4 w-full justify-between">
                  <Link href="/socials/emails/connect">
                    Connect your website <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-sm">
                    <Lock className="size-4" />
                  </span>
                  <span className="rounded-full bg-[#FBF0CE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8A6A16]">
                    Pro
                  </span>
                </div>
                <p className="mt-3 font-fredoka text-base font-bold leading-snug">
                  Sync contacts from your website
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Automatically pull new sign-ups and checkout emails straight into your audience.
                  Available on Pro and Agency.
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/plan">Upgrade</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        onSelect={(t) => setBody(t)}
        defaultType="email_body"
      />
    </section>
  )
}
