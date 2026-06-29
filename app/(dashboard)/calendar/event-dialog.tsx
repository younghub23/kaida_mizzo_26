'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type EventInput,
} from '@/app/actions/calendar'
import { SELECTABLE_CATEGORIES, getCategory } from './categories'
import { dateKey, type CalendarItem } from './calendar-utils'

type EventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // When editing an existing user event.
  item?: CalendarItem | null
  // Pre-selected date when adding from a day cell.
  defaultDate?: Date | null
  onSaved: () => void
}

const inputClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

// Uppercase accent micro-label, per the Tala field-label spec.
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-primary'

const pad = (n: number) => `${n}`.padStart(2, '0')
// "HH:mm" value for an <input type="time"> from a Date.
const toTimeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
// One hour later, capped at end-of-day, preserving the minutes.
function plusOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h)) return time
  return h + 1 > 23 ? '23:59' : `${pad(h + 1)}:${pad(m || 0)}`
}

export function EventDialog({
  open,
  onOpenChange,
  item,
  defaultDate,
  onSaved,
}: EventDialogProps) {
  const isEdit = Boolean(item?.event)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('personal')
  const [allDay, setAllDay] = useState(false)
  // A single day plus explicit start/end clock times (e.g. 2:00 PM → 4:00 PM).
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Seed the form whenever the dialog opens or its subject changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return

    if (item?.event) {
      const e = item.event
      const startDate = new Date(e.start_at)
      setTitle(e.title)
      setCategory(e.category)
      setAllDay(e.all_day)
      setDate(dateKey(startDate))
      setStartTime(toTimeValue(startDate))
      // End time is optional — leave it blank for open-ended events.
      setEndTime(e.end_at ? toTimeValue(new Date(e.end_at)) : '')
      setNotes(e.notes ?? '')
    } else {
      // New event. Honor a clicked hour (week/day grid) else default to 9:00am.
      // The end is left open — fill it in only if there's a specific end time.
      const base = defaultDate ? new Date(defaultDate) : new Date()
      const clickedTime = defaultDate && (base.getHours() !== 0 || base.getMinutes() !== 0)
      setTitle('')
      setCategory('personal')
      setAllDay(false)
      setDate(dateKey(base))
      setStartTime(clickedTime ? toTimeValue(base) : '09:00')
      setEndTime('')
      setNotes('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])
  /* eslint-enable react-hooks/set-state-in-effect */

  // If an end time is set but editing the start would put it on/before the
  // start, nudge the end an hour ahead. An empty (open-ended) end stays empty.
  function handleStartTimeChange(value: string) {
    setStartTime(value)
    if (endTime && endTime <= value) {
      setEndTime(plusOneHour(value))
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !date) {
      toast.error('Please add a title and a date')
      return
    }

    let startISO: string
    let endISO: string | null

    if (allDay) {
      const d = new Date(`${date}T00:00`)
      if (Number.isNaN(d.getTime())) {
        toast.error('Please pick a valid date')
        return
      }
      startISO = d.toISOString()
      endISO = null
    } else {
      const s = new Date(`${date}T${startTime}`)
      if (Number.isNaN(s.getTime())) {
        toast.error('Please add a start time')
        return
      }
      startISO = s.toISOString()
      // The end time is optional — leave the event open-ended when it's blank.
      if (endTime) {
        const en = new Date(`${date}T${endTime}`)
        if (Number.isNaN(en.getTime())) {
          toast.error('Please enter a valid end time')
          return
        }
        if (en.getTime() <= s.getTime()) {
          toast.error('The end time must be after the start time')
          return
        }
        endISO = en.toISOString()
      } else {
        endISO = null
      }
    }

    const input: EventInput = {
      title,
      notes,
      category,
      start_at: startISO,
      end_at: endISO,
      all_day: allDay,
    }

    setSaving(true)
    const res = isEdit && item?.event
      ? await updateCalendarEvent(item.event.id, input)
      : await createCalendarEvent(input)
    setSaving(false)

    if (res.success) {
      toast.success(isEdit ? 'Event updated' : 'Event added')
      onOpenChange(false)
      onSaved()
    } else {
      toast.error(res.error ?? 'Something went wrong')
    }
  }

  async function handleDelete() {
    if (!item?.event) return
    setDeleting(true)
    const res = await deleteCalendarEvent(item.event.id)
    setDeleting(false)
    if (res.success) {
      toast.success('Event deleted')
      onOpenChange(false)
      onSaved()
    } else {
      toast.error(res.error ?? 'Failed to delete event')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tala-theme max-w-md">
        <DialogHeader>
          <DialogTitle className="font-fredoka">{isEdit ? 'Edit event' : 'Add event'}</DialogTitle>
          <DialogDescription className="font-dm-serif italic">
            {isEdit ? 'Update the details of your event.' : 'Add anything to your calendar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title" className={labelClass}>Title</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {SELECTABLE_CATEGORIES.map((c) => {
                const active = category === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'shadow-[0_1px_5px_rgba(0,0,0,0.08)]'
                        : 'border-transparent bg-background text-[#5a5042] hover:bg-muted'
                    )}
                    style={
                      active
                        ? { backgroundColor: c.tint, borderColor: c.color, color: c.text }
                        : undefined
                    }
                  >
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-date" className={labelClass}>Date</Label>
            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-3.5"
            />
            All day
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-start" className={labelClass}>Starts at</Label>
                <input
                  id="event-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-end" className={labelClass}>Ends at (optional)</Label>
                <input
                  id="event-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-notes" className={labelClass}>Notes (optional)</Label>
            <textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any details…"
              className="w-full resize-none rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <DialogFooter className="items-center gap-2 sm:justify-between">
          {isEdit ? (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: getCategory(category).color }} />
              {getCategory(category).label}
            </span>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? 'Save' : 'Add event'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
