'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Check,
  Trash2,
  ChevronDown,
  CalendarDays,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  getCalendarEvents,
  getTodos,
  createTodo,
  toggleTodo,
  updateTodo,
  deleteTodo,
  type CalendarEvent,
  type CalendarTodo,
} from '@/app/actions/calendar'
import type { ScheduledPost } from '@/app/actions/social'
import { CATEGORIES, getCategory } from './categories'
import { EventDialog } from './event-dialog'
import {
  normalizeEvents,
  normalizePosts,
  getMonthMatrix,
  getWeekDays,
  itemsForDay,
  dateKey,
  sameDay,
  addDays,
  addMonths,
  startOfDay,
  formatTime,
  formatTimeShort,
  formatRelative,
  formatHourLabel,
  formatMonthYear,
  formatFullDate,
  WEEKDAY_LABELS,
  GRID_HOURS,
  DAY_START_HOUR,
  type CalendarItem,
  type CalendarView,
} from './calendar-utils'

type Props = {
  initialEvents: CalendarEvent[]
  initialPosts: ScheduledPost[]
  initialTodos: CalendarTodo[]
}

type Settings = { defaultView: CalendarView; compact: boolean }
const SETTINGS_KEY = 'tala-calendar-settings'
const HOUR_HEIGHT = 56
// Tint the today column with the same warm wash the mockup uses.
const TODAY_COLUMN_TINT =
  'linear-gradient(180deg, rgba(214,72,140,0.05), rgba(224,138,60,0.04))'

// Hex → rgba helper for the gentle per-day cell wash in month view.
function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function CalendarClient({ initialEvents, initialPosts, initialTodos }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [todos, setTodos] = useState<CalendarTodo[]>(initialTodos)
  const posts = initialPosts // read-only, auto-imported from scheduled_posts

  const [view, setView] = useState<CalendarView>('month')
  const [cursor, setCursor] = useState<Date>(() => new Date())

  // Dialog state
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null)
  const [addDate, setAddDate] = useState<Date | null>(null)
  const [detailItem, setDetailItem] = useState<CalendarItem | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Bottom panels (toggleable / collapsible)
  const [openPanels, setOpenPanels] = useState({ coming: true, updates: true, todo: true })
  // Whether the To-do panel spans the full width of the page
  const [todoExpanded, setTodoExpanded] = useState(false)

  // Settings (persisted to localStorage)
  const [settings, setSettings] = useState<Settings>({ defaultView: 'month', compact: false })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Settings
        /* eslint-disable react-hooks/set-state-in-effect */
        setSettings(parsed)
        setView(parsed.defaultView)
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      // ignore malformed settings
    }
  }, [])

  function persistSettings(next: Settings) {
    setSettings(next)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    } catch {
      // ignore quota / unavailable storage
    }
  }

  const today = new Date()

  const items = useMemo(
    () => [...normalizeEvents(events), ...normalizePosts(posts)],
    [events, posts]
  )

  async function refreshAll() {
    const [e, t] = await Promise.all([getCalendarEvents(), getTodos()])
    setEvents(e)
    setTodos(t)
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function shift(dir: 1 | -1) {
    if (view === 'month') setCursor((c) => addMonths(c, dir))
    else if (view === 'week') setCursor((c) => addDays(c, dir * 7))
    else setCursor((c) => addDays(c, dir))
  }

  function openAdd(date: Date | null) {
    setEditingItem(null)
    setAddDate(date)
    setEventDialogOpen(true)
  }

  function openItem(item: CalendarItem) {
    if (item.editable) {
      setEditingItem(item)
      setAddDate(null)
      setEventDialogOpen(true)
    } else {
      setDetailItem(item)
    }
  }

  // ── Derived lists for bottom panels ─────────────────────────────────────────
  const comingUp = useMemo(() => {
    const floor = startOfDay(today).getTime()
    return items
      .filter((it) => it.start.getTime() >= floor)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const updates = useMemo(
    () =>
      [...items]
        .sort((a, b) => b.start.getTime() - a.start.getTime())
        .slice(0, 6),
    [items]
  )

  const headingDate =
    view === 'day' ? formatFullDate(cursor) : formatMonthYear(cursor)

  return (
    <div className="tala-theme min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-6 lg:p-7">
        {/* ── Header ── */}
        <header className="relative flex flex-wrap items-end justify-between gap-6 overflow-hidden rounded-2xl border border-border bg-accent px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <div>
            <span className="block font-fredoka text-sm font-semibold lowercase tracking-[0.02em] text-primary">
              tala
            </span>
            <h1 className="font-fredoka text-[34px] font-semibold leading-none tracking-tight text-foreground">
              Calendar
            </h1>
            <p className="mt-1.5 font-dm-serif text-lg italic text-[#5a5042]">{headingDate}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Prev · Today · Next, joined into one pill */}
            <div className="flex items-center overflow-hidden rounded-lg border border-border bg-card">
              <button
                onClick={() => shift(-1)}
                aria-label="Previous"
                className="px-3 py-2 text-[#5a5042] transition-colors hover:bg-[rgba(164,141,120,0.12)] hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setCursor(new Date())}
                className="border-x border-border px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-[rgba(164,141,120,0.12)]"
              >
                Today
              </button>
              <button
                onClick={() => shift(1)}
                aria-label="Next"
                className="px-3 py-2 text-[#5a5042] transition-colors hover:bg-[rgba(164,141,120,0.12)] hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* View toggle */}
            <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-[3px]">
              {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                    view === v
                      ? 'tala-grad-soft text-white shadow-[0_1px_4px_rgba(200,71,46,0.3)]'
                      : 'text-[#5a5042] hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Calendar settings"
              className="flex size-[38px] items-center justify-center rounded-lg border border-border bg-card text-[#5a5042] transition-colors hover:bg-[rgba(164,141,120,0.12)] hover:text-foreground"
            >
              <Settings className="size-4" />
            </button>

            <Button size="default" onClick={() => openAdd(view === 'month' ? null : cursor)}>
              <Plus className="size-4" />
              Add event
            </Button>
          </div>
        </header>

        {/* ── Body: left rail + main view ── */}
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          {/* Left rail */}
          <div className="flex flex-col gap-5">
            <MiniMonth cursor={cursor} today={today} items={items} onPick={(d) => setCursor(d)} />
            <Legend />
          </div>

          {/* Main view */}
          <div className="min-w-0">
            {view === 'month' && (
              <MonthView
                cursor={cursor}
                today={today}
                items={items}
                compact={settings.compact}
                onAdd={openAdd}
                onOpenItem={openItem}
                onOpenDay={(d) => {
                  setCursor(d)
                  setView('day')
                }}
              />
            )}
            {view === 'week' && (
              <TimeGridView
                days={getWeekDays(cursor)}
                today={today}
                items={items}
                onAdd={openAdd}
                onOpenItem={openItem}
              />
            )}
            {view === 'day' && (
              <TimeGridView
                days={[cursor]}
                today={today}
                items={items}
                onAdd={openAdd}
                onOpenItem={openItem}
              />
            )}
          </div>
        </div>

        {/* ── Bottom panels ── */}
        <div className="grid gap-4 md:grid-cols-3">
          <Panel
            title="Coming up"
            open={openPanels.coming}
            onToggle={() => setOpenPanels((p) => ({ ...p, coming: !p.coming }))}
          >
            {comingUp.length === 0 ? (
              <EmptyHint text="Nothing scheduled yet." />
            ) : (
              <ul className="flex flex-col">
                {comingUp.map((it) => {
                  const cat = getCategory(it.category)
                  return (
                    <li key={it.id}>
                      <button
                        onClick={() => openItem(it)}
                        className="group flex w-full items-center gap-3 border-t border-border py-2 text-left first:border-t-0"
                      >
                        <span
                          className="flex w-[42px] shrink-0 flex-col items-center rounded-[7px] py-1.5 leading-none"
                          style={{ backgroundColor: cat.tint, color: cat.text }}
                        >
                          <span className="text-[9px] font-semibold uppercase tracking-[0.08em] opacity-85">
                            {it.start.toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                          <span className="mt-0.5 font-fredoka text-base font-semibold">
                            {it.start.getDate()}
                          </span>
                        </span>
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-foreground transition-colors group-hover:text-[#8a715c]">
                            {it.title}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {it.allDay ? 'All day' : formatTime(it.start)}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Updates"
            open={openPanels.updates}
            onToggle={() => setOpenPanels((p) => ({ ...p, updates: !p.updates }))}
          >
            {updates.length === 0 ? (
              <EmptyHint text="No recent activity." />
            ) : (
              <ul className="flex flex-col">
                {updates.map((it) => {
                  const cat = getCategory(it.category)
                  const label =
                    it.source === 'post'
                      ? `${it.meta?.status ?? 'Scheduled'}`
                      : getCategory(it.category).label
                  return (
                    <li key={it.id} className="flex gap-2.5 border-t border-border py-2 first:border-t-0">
                      <span
                        className="mt-1 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-[12.5px] capitalize leading-snug text-[#5a5042]">
                          <span className="font-medium text-foreground">{it.title}</span>
                          <span className="text-muted-foreground"> · {label}</span>
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                          {formatRelative(it.start, today)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="To-do"
            open={openPanels.todo}
            onToggle={() => setOpenPanels((p) => ({ ...p, todo: !p.todo }))}
            className={cn(todoExpanded && 'md:col-span-3')}
            action={
              <button
                onClick={() => setTodoExpanded((v) => !v)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={todoExpanded ? 'Collapse to-do list' : 'Expand to-do list to full width'}
                title={todoExpanded ? 'Collapse' : 'Expand to full width'}
              >
                {todoExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </button>
            }
          >
            <TodoList
              todos={todos}
              expanded={todoExpanded}
              onChanged={() => getTodos().then(setTodos)}
            />
          </Panel>
        </div>

        {/* ── Dialogs ── */}
        <EventDialog
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
          item={editingItem}
          defaultDate={addDate}
          onSaved={refreshAll}
        />

        <PostDetailDialog item={detailItem} onClose={() => setDetailItem(null)} />

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onChange={persistSettings}
        />
      </div>
    </div>
  )
}

// ── Mini month picker ─────────────────────────────────────────────────────────
function MiniMonth({
  cursor,
  today,
  items,
  onPick,
}: {
  cursor: Date
  today: Date
  items: CalendarItem[]
  onPick: (d: Date) => void
}) {
  const [view, setView] = useState(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1))

  // Keep the mini picker in sync when the main cursor jumps to another month.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(new Date(cursor.getFullYear(), cursor.getMonth(), 1))
  }, [cursor])

  const matrix = getMonthMatrix(view.getFullYear(), view.getMonth())

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-fredoka text-sm font-semibold">{formatMonthYear(view)}</span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LABELS.map((d) => (
          <span
            key={d}
            className="py-1 text-[9px] font-semibold uppercase tracking-[0.04em] text-muted-foreground"
          >
            {d[0]}
          </span>
        ))}
        {matrix.flat().map((d) => {
          const inMonth = d.getMonth() === view.getMonth()
          const isToday = sameDay(d, today)
          const isSelected = sameDay(d, cursor)
          const dayItems = itemsForDay(items, d)
          const showDot = inMonth && dayItems.length > 0 && !isToday && !isSelected
          return (
            <button
              key={dateKey(d)}
              onClick={() => onPick(d)}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-full text-[11.5px] tabular-nums transition-colors',
                !inMonth && 'text-muted-foreground/40',
                inMonth && 'hover:bg-[rgba(164,141,120,0.14)]',
                isToday && 'bg-primary font-semibold text-primary-foreground hover:bg-primary',
                isSelected && !isToday && 'bg-[rgba(164,141,120,0.22)] font-semibold text-foreground'
              )}
            >
              {d.getDate()}
              {showDot && (
                <span
                  className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: getCategory(dayItems[0].category).color }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Legend (MORE INFO) ────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
        More info
      </p>
      <ul className="flex flex-col gap-2.5">
        {CATEGORIES.map((c) => (
          <li key={c.key} className="flex items-center gap-2.5 text-[12.5px] text-[#5a5042]">
            <span
              className="size-2.5 rounded-full ring-[3px] ring-black/[0.03]"
              style={{ backgroundColor: c.color }}
            />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Month view ────────────────────────────────────────────────────────────────
function MonthView({
  cursor,
  today,
  items,
  compact,
  onAdd,
  onOpenItem,
  onOpenDay,
}: {
  cursor: Date
  today: Date
  items: CalendarItem[]
  compact: boolean
  onAdd: (d: Date) => void
  onOpenItem: (it: CalendarItem) => void
  onOpenDay: (d: Date) => void
}) {
  const matrix = getMonthMatrix(cursor.getFullYear(), cursor.getMonth())
  const maxPills = compact ? 2 : 3

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-primary"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {matrix.flat().map((day, idx) => {
          const inMonth = day.getMonth() === cursor.getMonth()
          const isToday = sameDay(day, today)
          const dayItems = itemsForDay(items, day)
          // Gentle wash matching the first event's category color.
          const tint =
            inMonth && dayItems.length > 0
              ? withAlpha(getCategory(dayItems[0].category).color, 0.06)
              : undefined
          return (
            <div
              key={dateKey(day)}
              onClick={() => onAdd(day)}
              style={tint ? { backgroundColor: tint } : undefined}
              className={cn(
                'group relative flex cursor-pointer flex-col gap-1 border-b border-r border-border p-[7px] transition-colors',
                compact ? 'min-h-[84px]' : 'min-h-[118px]',
                idx % 7 === 6 && 'border-r-0',
                idx >= 35 && 'border-b-0',
                !inMonth && 'bg-[rgba(164,141,120,0.045)]'
              )}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDay(day)
                  }}
                  className={cn(
                    'flex size-[25px] items-center justify-center rounded-full font-fredoka text-[13px] font-semibold tabular-nums transition-colors hover:bg-[rgba(164,141,120,0.14)]',
                    !inMonth && 'text-muted-foreground/40',
                    isToday && 'bg-primary text-primary-foreground hover:bg-primary'
                  )}
                >
                  {day.getDate()}
                </button>
                {inMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAdd(day)
                    }}
                    aria-label="Add event"
                    className="flex size-[19px] items-center justify-center rounded-full bg-[rgba(164,141,120,0.18)] text-primary opacity-0 transition hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
                  >
                    <Plus className="size-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {dayItems.slice(0, maxPills).map((it) => (
                  <EventPill key={it.id} item={it} onClick={onOpenItem} compact={compact} />
                ))}
                {dayItems.length > maxPills && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenDay(day)
                    }}
                    className="px-1 text-left font-dm-serif text-xs italic text-primary hover:text-[#8a715c]"
                  >
                    +{dayItems.length - maxPills} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventPill({
  item,
  onClick,
  compact,
}: {
  item: CalendarItem
  onClick: (it: CalendarItem) => void
  compact?: boolean
}) {
  const cat = getCategory(item.category)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(item)
      }}
      className={cn(
        'flex items-center gap-1.5 overflow-hidden rounded-[5px] border-l-[3px] text-left font-medium leading-tight',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-1.5 py-[3px] text-[11px]'
      )}
      style={{ backgroundColor: cat.tint, borderLeftColor: cat.color, color: cat.text }}
      title={item.title}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
      <span className="truncate">{item.title}</span>
      {!item.allDay && (
        <span className="ml-auto shrink-0 text-[9.5px] tabular-nums opacity-75">
          {formatTimeShort(item.start)}
        </span>
      )}
    </button>
  )
}

// ── Week / Day time grid ──────────────────────────────────────────────────────
function TimeGridView({
  days,
  today,
  items,
  onAdd,
  onOpenItem,
}: {
  days: Date[]
  today: Date
  items: CalendarItem[]
  onAdd: (d: Date) => void
  onOpenItem: (it: CalendarItem) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Day headers */}
      <div
        className="grid border-b border-border"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
      >
        <div />
        {days.map((d) => {
          const isToday = sameDay(d, today)
          return (
            <div key={dateKey(d)} className="border-l border-border px-2 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                {WEEKDAY_LABELS[d.getDay()]}
              </div>
              <div
                className={cn(
                  'mx-auto mt-0.5 flex size-8 items-center justify-center rounded-full font-fredoka text-lg font-semibold tabular-nums',
                  isToday && 'bg-primary text-primary-foreground'
                )}
              >
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* All-day row */}
      <div
        className="grid border-b border-border"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
      >
        <div className="flex items-center justify-end px-2 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          All day
        </div>
        {days.map((d) => {
          const allDayItems = itemsForDay(items, d).filter((it) => it.allDay)
          return (
            <div
              key={dateKey(d)}
              className="flex min-h-[34px] flex-col gap-0.5 border-l border-border p-1"
            >
              {allDayItems.map((it) => (
                <EventPill key={it.id} item={it} onClick={onOpenItem} />
              ))}
            </div>
          )
        })}
      </div>

      {/* Scrollable hour grid */}
      <div className="max-h-[640px] overflow-y-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
        >
          {/* Hour labels */}
          <div>
            {GRID_HOURS.map((h, i) => (
              <div
                key={h}
                className={cn('relative', i > 0 && 'border-t border-border')}
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-2 text-[9.5px] tabular-nums text-muted-foreground">
                  {formatHourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const isToday = sameDay(day, today)
            const timed = itemsForDay(items, day).filter((it) => !it.allDay)
            return (
              <div
                key={dateKey(day)}
                className="relative border-l border-border"
                style={isToday ? { backgroundImage: TODAY_COLUMN_TINT } : undefined}
              >
                {GRID_HOURS.map((h, i) => (
                  <div
                    key={h}
                    className={cn(
                      'transition-colors hover:bg-[rgba(164,141,120,0.08)]',
                      i > 0 && 'border-t border-border'
                    )}
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => {
                      const d = new Date(day)
                      d.setHours(h, 0, 0, 0)
                      onAdd(d)
                    }}
                  />
                ))}
                {timed.map((it) => {
                  const startMin = it.start.getHours() * 60 + it.start.getMinutes()
                  const endMin = it.end
                    ? it.end.getHours() * 60 + it.end.getMinutes()
                    : startMin + 60
                  const top = Math.max(((startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT, 0)
                  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT - 3, 22)
                  const cat = getCategory(it.category)
                  return (
                    <button
                      key={it.id}
                      onClick={() => onOpenItem(it)}
                      className="absolute left-1 right-1 overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left shadow-[0_1px_3px_rgba(58,46,34,0.1)] transition hover:shadow-[0_2px_7px_rgba(58,46,34,0.16)]"
                      style={{
                        top,
                        height,
                        backgroundColor: cat.tint,
                        borderLeftColor: cat.color,
                        color: cat.text,
                      }}
                      title={it.title}
                    >
                      <span className="block truncate text-[11.5px] font-semibold leading-tight">
                        {it.title}
                      </span>
                      <span className="block truncate text-[10px] opacity-80">
                        {formatTime(it.start)}
                        {it.end ? ` – ${formatTime(it.end)}` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Bottom panel shell ────────────────────────────────────────────────────────
function Panel({
  title,
  open,
  onToggle,
  action,
  className,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      <div className="flex w-full items-center justify-between gap-2 px-[18px] py-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
        <button onClick={onToggle} className="flex flex-1 items-center text-left">
          {title}
        </button>
        <div className="flex items-center gap-1.5">
          {action}
          <button onClick={onToggle} aria-label={open ? 'Collapse section' : 'Expand section'}>
            <ChevronDown
              className={cn('size-4 text-muted-foreground transition-transform', !open && '-rotate-90')}
            />
          </button>
        </div>
      </div>
      {open && <div className="px-[18px] pb-4">{children}</div>}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>
}

// ── To-do list ────────────────────────────────────────────────────────────────
function TodoList({
  todos,
  expanded,
  onChanged,
}: {
  todos: CalendarTodo[]
  expanded?: boolean
  onChanged: () => void
}) {
  const [value, setValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  async function add() {
    if (!value.trim()) return
    setAdding(true)
    const res = await createTodo(value)
    setAdding(false)
    if (res.success) {
      setValue('')
      onChanged()
    } else {
      toast.error(res.error ?? 'Failed to add task')
    }
  }

  function startEdit(t: CalendarTodo) {
    setEditingId(t.id)
    setEditValue(t.title)
  }

  async function saveEdit(id: string) {
    const trimmed = editValue.trim()
    setEditingId(null)
    const current = todos.find((t) => t.id === id)
    // Nothing to do when blank or unchanged.
    if (!trimmed || (current && trimmed === current.title)) return
    const res = await updateTodo(id, trimmed)
    if (res.success) onChanged()
    else toast.error(res.error ?? 'Failed to update task')
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Inline add row, matching the bordered "+ Add a task" field. */}
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
        <Plus className="size-4 shrink-0 text-primary" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void add()
            }
          }}
          placeholder="Add a task"
          disabled={adding}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {todos.length === 0 ? (
        <EmptyHint text="No tasks yet." />
      ) : (
        <ul
          className={cn(
            'flex flex-col',
            expanded && 'sm:grid sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-3'
          )}
        >
          {todos.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-2.5 border-t border-border py-[7px] text-sm first:border-t-0"
            >
              <button
                onClick={async () => {
                  const res = await toggleTodo(t.id, !t.done)
                  if (res.success) onChanged()
                }}
                className={cn(
                  'flex size-[17px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-primary text-primary-foreground transition-colors',
                  t.done && 'bg-primary'
                )}
                aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {t.done && <Check className="size-3" />}
              </button>
              {editingId === t.id ? (
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void saveEdit(t.id)
                    } else if (e.key === 'Escape') {
                      e.preventDefault()
                      setEditingId(null)
                    }
                  }}
                  onBlur={() => void saveEdit(t.id)}
                  className="h-7 flex-1 text-sm"
                />
              ) : (
                <button
                  onClick={() => startEdit(t)}
                  className={cn(
                    'flex-1 truncate rounded px-1 py-0.5 text-left text-[13px] transition-colors hover:bg-[rgba(164,141,120,0.1)]',
                    t.done && 'text-muted-foreground line-through'
                  )}
                  title="Click to edit"
                >
                  {t.title}
                </button>
              )}
              <button
                onClick={async () => {
                  const res = await deleteTodo(t.id)
                  if (res.success) onChanged()
                }}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label="Delete task"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Read-only post detail ─────────────────────────────────────────────────────
function PostDetailDialog({ item, onClose }: { item: CalendarItem | null; onClose: () => void }) {
  const open = Boolean(item)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="tala-theme max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-fredoka">
            <CalendarDays className="size-4 text-muted-foreground" />
            Scheduled post
          </DialogTitle>
          <DialogDescription className="font-dm-serif italic">
            Imported from your social schedule — edit it on the Social page.
          </DialogDescription>
        </DialogHeader>
        {item && (
          <div className="flex flex-col gap-3 text-sm">
            <p>{item.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{item.meta?.status}</span>
              {item.meta?.platforms?.map((p) => (
                <span key={p} className="rounded-full bg-muted px-2 py-0.5 capitalize">
                  {p}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.start.toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────────
function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  settings: Settings
  onChange: (s: Settings) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tala-theme max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-fredoka">Calendar settings</DialogTitle>
          <DialogDescription className="font-dm-serif italic">
            Personalize how your calendar looks.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Default view
            </span>
            <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
              {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => onChange({ ...settings, defaultView: v })}
                  className={cn(
                    'flex-1 rounded-md px-2.5 py-2 text-sm font-medium capitalize transition-colors',
                    settings.defaultView === v
                      ? 'tala-grad-soft text-white shadow-sm'
                      : 'text-[#5a5042] hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onChange({ ...settings, compact: !settings.compact })}
            className="flex items-center gap-2.5 text-left text-sm text-[#5a5042]"
          >
            <span
              className={cn(
                'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-primary text-primary-foreground transition-colors',
                settings.compact && 'bg-primary'
              )}
            >
              {settings.compact && <Check className="size-3" />}
            </span>
            <span>Compact rows — tighten the month cells</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
