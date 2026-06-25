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
import { dateKey, toDateTimeLocal, type CalendarItem } from './calendar-utils'

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
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Seed the form whenever the dialog opens or its subject changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return

    if (item?.event) {
      const e = item.event
      setTitle(e.title)
      setCategory(e.category)
      setAllDay(e.all_day)
      const startDate = new Date(e.start_at)
      setStart(e.all_day ? dateKey(startDate) : toDateTimeLocal(startDate))
      setEnd(e.end_at ? (e.all_day ? dateKey(new Date(e.end_at)) : toDateTimeLocal(new Date(e.end_at))) : '')
      setNotes(e.notes ?? '')
    } else {
      // New event. Default to the chosen day at 9:00am.
      const base = defaultDate ? new Date(defaultDate) : new Date()
      base.setHours(9, 0, 0, 0)
      setTitle('')
      setCategory('personal')
      setAllDay(false)
      setStart(toDateTimeLocal(base))
      setEnd('')
      setNotes('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Switching all-day on/off converts the existing value between date and datetime-local.
  function handleAllDayChange(checked: boolean) {
    setAllDay(checked)
    if (start) {
      const d = new Date(start)
      if (!Number.isNaN(d.getTime())) {
        setStart(checked ? dateKey(d) : toDateTimeLocal(d))
      }
    }
    if (end) {
      const d = new Date(end)
      if (!Number.isNaN(d.getTime())) {
        setEnd(checked ? dateKey(d) : toDateTimeLocal(d))
      }
    }
  }

  function toISO(value: string): string | null {
    if (!value) return null
    // For all-day, value is YYYY-MM-DD; anchor to local midnight.
    const d = allDay ? new Date(`${value}T00:00`) : new Date(value)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  async function handleSubmit() {
    const startISO = toISO(start)
    if (!title.trim() || !startISO) {
      toast.error('Please add a title and a start date')
      return
    }

    const input: EventInput = {
      title,
      notes,
      category,
      start_at: startISO,
      end_at: toISO(end),
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
                      'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                      active ? 'border-foreground/30 bg-muted' : 'border-border hover:bg-muted'
                    )}
                  >
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => handleAllDayChange(e.target.checked)}
              className="size-3.5"
            />
            All day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-start" className={labelClass}>Starts</Label>
              <input
                id="event-start"
                type={allDay ? 'date' : 'datetime-local'}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-end" className={labelClass}>Ends (optional)</Label>
              <input
                id="event-end"
                type={allDay ? 'date' : 'datetime-local'}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

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
