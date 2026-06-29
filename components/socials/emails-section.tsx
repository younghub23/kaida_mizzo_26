'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Mail, Clock, Loader2, Link2, Lock, ArrowRight, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { cn } from '@/lib/utils'
import { saveEmail, type EmailActionState } from '@/app/actions/email'
import { TIMEZONES } from '@/lib/socials/platforms'
import { getCategory, type CategoryKey } from '@/app/(dashboard)/calendar/categories'

const INITIAL: EmailActionState = { error: null, success: false }

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Added manually',
  purchase: 'Customers',
  signup: 'Sign-ups',
  newsletter: 'Newsletter',
  website: 'Website',
}

// Map a real contact source onto one of the calendar category palettes so each
// audience chip carries a meaningful dot/tint/text. Unknown sources cycle through
// the four palettes deterministically — no invented colors.
const SOURCE_CATEGORY: Record<string, CategoryKey> = {
  newsletter: 'email',
  website: 'content',
  signup: 'work',
  purchase: 'social',
  manual: 'social',
}
const CHIP_CYCLE: CategoryKey[] = ['social', 'email', 'content', 'work']

const fieldLabel = 'font-fredoka text-[12.5px] font-medium text-foreground'
const microLabel = 'font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary'
const warmInput =
  'w-full rounded-[11px] border border-[rgba(164,141,120,0.34)] bg-card px-[13px] py-2.5 text-[13.5px] text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[rgba(164,141,120,0.15)]'

export function EmailsSection({
  canSync,
  contactCount,
  sources,
  sourceCounts,
}: {
  canSync: boolean
  contactCount: number
  sources: string[]
  sourceCounts: Record<string, number>
}) {
  const [state, formAction, isPending] = useActionState(saveEmail, INITIAL)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('all')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
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
    <section className="mt-[6px] flex flex-col">
      <div className="mb-4 flex items-baseline gap-3">
        <span className={microLabel}>Emails</span>
        <span className="text-[12.5px] text-muted-foreground">
          Reach your audience directly in the inbox
        </span>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_1px_0_rgba(255,255,255,.6)_inset] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(58,46,34,.1)]">
        {/* head */}
        <div className="flex items-center gap-3.5 border-b border-border px-[22px] pb-[18px] pt-5">
          <span className="flex size-[42px] items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#F4C96D,#E08A3C)] text-white shadow-[0_3px_10px_rgba(244,201,109,.4)]">
            <Mail className="size-[22px]" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h3 className="font-fredoka text-lg font-semibold leading-tight">Email campaign</h3>
            <p className="font-dm-serif text-[12.5px] italic text-muted-foreground">
              Compose a broadcast to your contacts
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="ml-auto h-8 gap-1.5 px-3 font-fredoka text-[12.5px]"
          >
            <Link href="/socials/emails/list">
              Manage list
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {/* stats row */}
        <div className="flex flex-wrap items-center gap-x-[26px] gap-y-4 border-b border-border px-[22px] py-4">
          <div>
            <div className="font-fredoka text-[26px] font-semibold leading-none">
              {contactCount.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Contacts
            </div>
          </div>

          {/* Open rate is not tracked in this codebase — neutral placeholder, not a fabricated %. */}
          <div>
            <div className="font-fredoka text-[26px] font-semibold leading-none text-muted-foreground">
              —
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Avg. open rate · not tracked
            </div>
          </div>

          {sources.length > 0 && (
            <div className="flex flex-col gap-[7px]">
              <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                Audience sources
              </span>
              <div className="flex flex-wrap gap-[7px]">
                {sources.map((s, i) => {
                  const cat = getCategory(SOURCE_CATEGORY[s] ?? CHIP_CYCLE[i % CHIP_CYCLE.length])
                  return (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] font-fredoka text-xs font-medium"
                      style={{ background: cat.tint, color: cat.text }}
                    >
                      <span className="size-[7px] rounded-full" style={{ background: cat.color }} />
                      {SOURCE_LABELS[s] ?? s} · {(sourceCounts[s] ?? 0).toLocaleString()}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* body */}
        <div className="grid grid-cols-1 gap-[22px] p-[22px] lg:grid-cols-[1fr_300px]">
          {/* compose form */}
          <form className="flex flex-col gap-4">
            <div>
              <div className="mb-[7px]">
                <span className={fieldLabel}>Subject</span>
              </div>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your subject line"
                className={warmInput}
              />
            </div>

            <div>
              <div className="mb-[7px] flex items-center justify-between">
                <span className={fieldLabel}>Body</span>
                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-[9px] border border-[rgba(214,72,140,0.25)] bg-[linear-gradient(120deg,rgba(214,72,140,.12),rgba(224,138,60,.12))] px-2.5 py-1 font-fredoka text-[11px] font-medium text-[#A82C66] transition-[transform,background] hover:-translate-y-px hover:bg-[linear-gradient(120deg,rgba(214,72,140,.2),rgba(224,138,60,.2))]"
                >
                  <Sparkles className="size-3" />
                  Draft with AI
                </button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email…"
                className="min-h-[150px] w-full resize-y rounded-[12px] border border-[rgba(164,141,120,0.34)] bg-card px-4 py-3.5 text-sm leading-[1.55] text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[rgba(164,141,120,0.15)]"
              />
            </div>

            <div>
              <div className="mb-[7px]">
                <span className={fieldLabel}>Audience</span>
              </div>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className={warmInput}
              >
                <option value="all">All contacts · {contactCount.toLocaleString()}</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s] ?? s} · {(sourceCounts[s] ?? 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-[7px]">
                <span className={fieldLabel}>Schedule</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.1fr_0.9fr_1fr]">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={warmInput}
                />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={warmInput}
                />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={cn(warmInput, 'col-span-2 sm:col-span-1')}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input type="hidden" name="subject" value={subject} />
            <input type="hidden" name="body" value={body} />
            <input type="hidden" name="audience" value={audience} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="time" value={time} />
            <input type="hidden" name="timezone" value={timezone} />
            <input type="hidden" name="intent" value={intent} />

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Button
                type="submit"
                formAction={formAction}
                disabled={isPending}
                onClick={() => setIntent('send')}
                className="h-9 gap-2 px-4 font-fredoka max-sm:w-full"
              >
                {isPending && intent === 'send' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-4" />
                    Send now
                  </>
                )}
              </Button>
              <Button
                type="submit"
                variant="outline"
                formAction={formAction}
                disabled={isPending}
                onClick={() => setIntent('schedule')}
                className="h-9 gap-2 px-4 font-fredoka max-sm:w-full"
              >
                {isPending && intent === 'schedule' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Clock className="size-4" />
                    Schedule
                  </>
                )}
              </Button>
              <Button
                type="submit"
                variant="ghost"
                formAction={formAction}
                disabled={isPending}
                onClick={() => setIntent('draft')}
                className="h-9 px-4 font-fredoka max-sm:w-full"
              >
                {isPending && intent === 'draft' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Save draft'
                )}
              </Button>
            </div>
          </form>

          {/* plan gate — locked upsell or active website-sync CTA */}
          {canSync ? (
            <div className="relative overflow-hidden rounded-[13px] border border-border bg-[linear-gradient(165deg,rgba(54,183,192,.12),rgba(154,198,224,.06))] p-[18px]">
              <span className="absolute right-3.5 top-3.5 rounded-md bg-[#DCF1F2] px-2 py-[3px] font-fredoka text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#1E7B82]">
                Active
              </span>
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="flex size-[30px] items-center justify-center rounded-[9px] bg-[#DCF1F2]">
                  <Link2 className="size-4 text-[#1E7B82]" strokeWidth={2} />
                </span>
                <h4 className="font-fredoka text-[14.5px] font-semibold leading-tight">
                  Sync contacts
                  <br />
                  from your website
                </h4>
              </div>
              <p className="mb-3.5 text-xs leading-[1.45] text-muted-foreground">
                Automatically pull new sign-ups and checkout emails straight into your audience.
              </p>
              <Button asChild className="h-9 w-full justify-center gap-1.5 font-fredoka">
                <Link href="/socials/emails/connect">
                  Connect your website
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[13px] border border-border bg-[linear-gradient(165deg,rgba(244,201,109,.12),rgba(224,138,60,.06))] p-[18px]">
              <span className="absolute right-3.5 top-3.5 rounded-md bg-[#FBF0D2] px-2 py-[3px] font-fredoka text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#9A6E16]">
                Studio
              </span>
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="flex size-[30px] items-center justify-center rounded-[9px] bg-[#FBF0D2]">
                  <Lock className="size-4 text-[#9A6E16]" strokeWidth={2} />
                </span>
                <h4 className="font-fredoka text-[14.5px] font-semibold leading-tight">
                  Sync contacts
                  <br />
                  from your website
                </h4>
              </div>
              <p className="mb-3.5 text-xs leading-[1.45] text-muted-foreground">
                Automatically pull new sign-ups and checkout emails straight into your audience.
                Available on the Studio plan.
              </p>
              <Button asChild className="h-9 w-full justify-center font-fredoka">
                <Link href="/plan">Upgrade</Link>
              </Button>
            </div>
          )}
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
