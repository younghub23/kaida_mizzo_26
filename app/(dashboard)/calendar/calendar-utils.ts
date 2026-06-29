// Pure, client-safe helpers: date math for the month/week/day grids and
// normalization of the various data sources into a single CalendarItem shape.

import type { CalendarEvent } from '@/app/actions/calendar'
import type { ScheduledPost } from '@/app/actions/social'

export type CalendarItem = {
  id: string
  // 'event' = user-created (editable); 'post' = auto-imported from scheduled_posts (read-only).
  source: 'event' | 'post'
  title: string
  notes: string | null
  category: string
  start: Date
  end: Date | null
  allDay: boolean
  editable: boolean
  // Original event, present only when source === 'event', used to seed the edit dialog.
  event?: CalendarEvent
  // Extra context for posts (platforms / status) shown in the detail popover.
  meta?: { platforms?: string[]; status?: string }
}

export type CalendarView = 'month' | 'week' | 'day'

export function normalizeEvents(events: CalendarEvent[]): CalendarItem[] {
  return events.map((e) => ({
    id: e.id,
    source: 'event' as const,
    title: e.title,
    notes: e.notes,
    category: e.category,
    start: new Date(e.start_at),
    end: e.end_at ? new Date(e.end_at) : null,
    allDay: e.all_day,
    editable: true,
    event: e,
  }))
}

export function normalizePosts(posts: ScheduledPost[]): CalendarItem[] {
  return posts.map((p) => ({
    id: `post-${p.id}`,
    source: 'post' as const,
    title: p.content || 'Scheduled post',
    notes: null,
    category: 'social',
    start: new Date(p.scheduled_at),
    end: null,
    allDay: false,
    editable: false,
    meta: { platforms: p.platforms, status: p.status },
  }))
}

// ── Date helpers (all local time) ────────────────────────────────────────────

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function sameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b)
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

// Sunday-start week containing `d`.
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  x.setDate(x.getDate() - x.getDay())
  return x
}

export function getWeekDays(d: Date): Date[] {
  const start = startOfWeek(d)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// 6-row month matrix (always 42 cells) starting on the Sunday on/before the 1st.
export function getMonthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1)
  const gridStart = startOfWeek(first)
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(gridStart, w * 7 + i)))
  }
  return weeks
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const HOURS = Array.from({ length: 24 }, (_, i) => i)

// The week/day time grid only renders working hours, matching the Tala design:
// 7 AM through 8 PM, inclusive.
export const DAY_START_HOUR = 7
export const DAY_END_HOUR = 20
export const GRID_HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i
)

export function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// Compact time label for month-cell pills, e.g. "10a" or "1:30p".
export function formatTimeShort(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const suffix = h < 12 ? 'a' : 'p'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}${m ? `:${`${m}`.padStart(2, '0')}` : ''}${suffix}`
}

// Human, relative phrasing for the Updates feed, e.g. "2 hours ago" / "in 3 days".
export function formatRelative(d: Date, now: Date = new Date()): string {
  const diffMs = d.getTime() - now.getTime()
  const past = diffMs <= 0
  const abs = Math.abs(diffMs)
  const min = Math.round(abs / 60000)
  const hr = Math.round(abs / 3600000)
  const day = Math.round(abs / 86400000)

  if (min < 1) return 'Just now'
  if (min < 60) return past ? `${min} min ago` : `In ${min} min`
  if (hr < 24) return past ? `${hr} hour${hr === 1 ? '' : 's'} ago` : `In ${hr} hour${hr === 1 ? '' : 's'}`
  if (day === 1) return past ? 'Yesterday' : 'Tomorrow'
  if (day < 7) return past ? `${day} days ago` : `In ${day} days`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatFullDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Items that fall on a given day (timed or all-day), sorted by start time.
export function itemsForDay(items: CalendarItem[], day: Date): CalendarItem[] {
  const key = dateKey(day)
  return items
    .filter((it) => dateKey(it.start) === key)
    .sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1
      return a.start.getTime() - b.start.getTime()
    })
}

// Build a datetime-local input value (YYYY-MM-DDTHH:mm) from a Date in local time.
export function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}
