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
  formatHourLabel,
  formatMonthYear,
  formatFullDate,
  WEEKDAY_LABELS,
  HOURS,
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
const HOUR_HEIGHT = 48

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
    <div className="tala-theme flex min-h-screen flex-col gap-5 bg-background p-6 font-sans text-foreground">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-fredoka text-sm font-semibold lowercase tracking-[0.04em] text-primary">
            tala
          </p>
          <h1 className="font-fredoka text-3xl font-semibold tracking-tight text-foreground">
            Calendar
          </h1>
          <p className="mt-0.5 font-dm-serif text-xl italic text-muted-foreground">{headingDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => shift(-1)} aria-label="Previous">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => shift(1)} aria-label="Next">
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* View toggle */}
          <div className="inline-flex items-center rounded-lg border border-border p-0.5">
            {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-sm font-medium capitalize transition-colors',
                  view === v
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <Button variant="outline" size="icon-sm" onClick={() => setSettingsOpen(true)} aria-label="Calendar settings">
            <Settings className="size-4" />
          </Button>
          <Button size="sm" onClick={() => openAdd(view === 'month' ? null : cursor)}>
            <Plus className="size-4" />
            Add event
          </Button>
        </div>
      </div>

      {/* ── Body: left rail + main view ── */}
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* Left rail */}
        <div className="flex flex-col gap-5">
          <MiniMonth
            cursor={cursor}
            today={today}
            items={items}
            onPick={(d) => setCursor(d)}
          />
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
            <ul className="flex flex-col gap-2">
              {comingUp.map((it) => (
                <li key={it.id}>
                  <button
                    onClick={() => openItem(it)}
                    className="flex w-full items-center gap-2 text-left text-sm hover:text-foreground"
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: getCategory(it.category).color }} />
                    <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
                      {`${it.start.getMonth() + 1}/${it.start.getDate()}`}
                    </span>
                    <span className="truncate">{it.title}</span>
                  </button>
                </li>
              ))}
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
            <ul className="flex flex-col gap-2 text-sm">
              {updates.map((it) => (
                <li key={it.id} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">
                    {it.source === 'post'
                      ? `${it.meta?.status ?? 'scheduled'} · ${it.title}`
                      : `${getCategory(it.category).label} · ${it.title}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="To-do"
          open={openPanels.todo}
          onToggle={() => setOpenPanels((p) => ({ ...p, todo: !p.todo }))}
        >
          <TodoList todos={todos} onChanged={() => getTodos().then(setTodos)} />
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
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
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
            className="py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"
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
                'relative flex h-6 items-center justify-center rounded-full font-fredoka text-xs tabular-nums transition-colors',
                !inMonth && 'text-muted-foreground/40',
                inMonth && 'hover:bg-muted',
                isToday && 'bg-primary text-primary-foreground hover:bg-primary',
                isSelected && !isToday && 'bg-accent text-foreground'
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
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
        More info
      </p>
      <ul className="flex flex-col gap-1.5">
        {CATEGORIES.map((c) => (
          <li key={c.key} className="flex items-center gap-2 text-sm">
            <span className="size-3 rounded-full" style={{ backgroundColor: c.color }} />
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
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"
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
          return (
            <div
              key={dateKey(day)}
              onClick={() => onAdd(day)}
              className={cn(
                'group flex cursor-pointer flex-col gap-1 border-b border-r border-border p-1.5 transition-colors hover:bg-muted/40',
                compact ? 'min-h-[88px]' : 'min-h-[112px]',
                idx % 7 === 6 && 'border-r-0',
                !inMonth && 'bg-muted/20'
              )}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDay(day)
                  }}
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full font-fredoka text-xs tabular-nums transition-colors hover:bg-muted',
                    !inMonth && 'text-muted-foreground/40',
                    isToday && 'bg-primary font-semibold text-primary-foreground hover:bg-primary'
                  )}
                >
                  {day.getDate()}
                </button>
                <Plus className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <div className="flex flex-col gap-0.5">
                {dayItems.slice(0, maxPills).map((it) => (
                  <EventPill key={it.id} item={it} onClick={onOpenItem} />
                ))}
                {dayItems.length > maxPills && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenDay(day)
                    }}
                    className="px-1 text-left font-dm-serif text-xs italic text-muted-foreground hover:text-foreground"
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

function EventPill({ item, onClick }: { item: CalendarItem; onClick: (it: CalendarItem) => void }) {
  const cat = getCategory(item.category)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(item)
      }}
      className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] font-medium"
      style={{ backgroundColor: cat.tint, color: cat.text }}
      title={item.title}
    >
      {!item.allDay && (
        <span className="shrink-0 opacity-70 tabular-nums">
          {item.start.toLocaleTimeString(undefined, { hour: 'numeric' })}
        </span>
      )}
      <span className="truncate">{item.title}</span>
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
        className="grid border-b border-border bg-muted/40"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
      >
        <div className="border-r border-border" />
        {days.map((d) => {
          const isToday = sameDay(d, today)
          return (
            <div key={dateKey(d)} className="border-r border-border px-2 py-1.5 text-center last:border-r-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {WEEKDAY_LABELS[d.getDay()]}
              </div>
              <div
                className={cn(
                  'mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full font-fredoka text-sm font-medium tabular-nums',
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
        <div className="border-r border-border px-1 py-1 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
          All day
        </div>
        {days.map((d) => {
          const allDayItems = itemsForDay(items, d).filter((it) => it.allDay)
          return (
            <div key={dateKey(d)} className="flex min-h-[28px] flex-col gap-0.5 border-r border-border p-1 last:border-r-0">
              {allDayItems.map((it) => (
                <EventPill key={it.id} item={it} onClick={onOpenItem} />
              ))}
            </div>
          )
        })}
      </div>

      {/* Scrollable hour grid */}
      <div className="max-h-[560px] overflow-y-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
        >
          {/* Hour labels */}
          <div className="border-r border-border">
            {HOURS.map((h) => (
              <div key={h} className="relative border-b border-border" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2 right-1 text-[10px] text-muted-foreground">
                  {h === 0 ? '' : formatHourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const timed = itemsForDay(items, day).filter((it) => !it.allDay)
            return (
              <div key={dateKey(day)} className="relative border-r border-border last:border-r-0">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b border-border transition-colors hover:bg-muted/40"
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
                  const top = (startMin / 60) * HOUR_HEIGHT
                  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 22)
                  const cat = getCategory(it.category)
                  return (
                    <button
                      key={it.id}
                      onClick={() => onOpenItem(it)}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-left text-[11px] leading-tight"
                      style={{ top, height, backgroundColor: cat.tint, color: cat.text }}
                      title={it.title}
                    >
                      <span className="block truncate font-medium">{it.title}</span>
                      <span className="block truncate opacity-70">{formatTime(it.start)}</span>
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
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
      >
        {title}
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>
}

// ── To-do list ────────────────────────────────────────────────────────────────
function TodoList({ todos, onChanged }: { todos: CalendarTodo[]; onChanged: () => void }) {
  const [value, setValue] = useState('')
  const [adding, setAdding] = useState(false)

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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void add()
            }
          }}
          placeholder="Add a task…"
          className="h-7 text-sm"
        />
        <Button size="sm" onClick={add} disabled={adding}>
          Add
        </Button>
      </div>

      {todos.length === 0 ? (
        <EmptyHint text="No tasks yet." />
      ) : (
        <ul className="flex flex-col gap-1">
          {todos.map((t) => (
            <li key={t.id} className="group flex items-center gap-2 text-sm">
              <button
                onClick={async () => {
                  const res = await toggleTodo(t.id, !t.done)
                  if (res.success) onChanged()
                }}
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded border border-border transition-colors',
                  t.done && 'border-primary bg-primary text-primary-foreground'
                )}
                aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {t.done && <Check className="size-3" />}
              </button>
              <span className={cn('flex-1 truncate', t.done && 'text-muted-foreground line-through')}>
                {t.title}
              </span>
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
            <div className="inline-flex items-center rounded-lg border border-border p-0.5">
              {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => onChange({ ...settings, defaultView: v })}
                  className={cn(
                    'flex-1 rounded-md px-2.5 py-1 text-sm font-medium capitalize transition-colors',
                    settings.defaultView === v
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between text-sm">
            <span className="font-medium">Compact month rows</span>
            <input
              type="checkbox"
              checked={settings.compact}
              onChange={(e) => onChange({ ...settings, compact: e.target.checked })}
              className="size-4"
            />
          </label>
        </div>
      </DialogContent>
    </Dialog>
  )
}
