'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarEvent } from '@/app/actions/calendar'
import type { ScheduledPost } from '@/app/actions/social'
import { getCategory } from '@/app/(dashboard)/calendar/categories'
import {
  normalizeEvents,
  normalizePosts,
  getMonthMatrix,
  itemsForDay,
  sameDay,
  dateKey,
  addMonths,
  WEEKDAY_LABELS,
} from '@/app/(dashboard)/calendar/calendar-utils'
import { card } from '@/app/(dashboard)/profile/ui'

// Legend mirrors the four headline calendar categories from the mockup, sourced
// from the shared category table (no hardcoded colors).
const LEGEND_KEYS = ['social', 'email', 'content', 'work'] as const

// Full-width month calendar for the dashboard. Prev/next/Today change the
// visible month locally; every cell links into the real /calendar page. Data is
// the user's real calendar events + scheduled posts — no sample EVENTS map.
export function DashboardCalendar({
  events,
  posts,
}: {
  events: CalendarEvent[]
  posts: ScheduledPost[]
}) {
  const items = useMemo(
    () => [...normalizeEvents(events), ...normalizePosts(posts)],
    [events, posts]
  )
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const matrix = getMonthMatrix(cursor.getFullYear(), cursor.getMonth())

  return (
    <div className={`${card} overflow-hidden`}>
      {/* Header: month/year + Today · prev · next */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-baseline gap-2.5">
          <span className="font-fredoka text-lg font-semibold">
            {cursor.toLocaleDateString(undefined, { month: 'long' })}
          </span>
          <span className="font-dm-serif text-base italic text-primary">
            {cursor.getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-lg border border-[rgba(164,141,120,.34)] px-3 py-1.5 font-fredoka text-[12.5px] font-medium text-primary transition-colors hover:bg-accent"
          >
            Today
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="Previous month"
            className="flex size-8 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="size-[17px]" />
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="Next month"
            className="flex size-8 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="size-[17px]" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 px-3.5 pb-1 pt-3">
        {WEEKDAY_LABELS.map((d) => (
          <span
            key={d}
            className="text-center font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5 px-3.5 pb-4 pt-1">
        {matrix.flat().map((day) => {
          const inMonth = day.getMonth() === cursor.getMonth()
          const isToday = sameDay(day, today)
          const dayItems = itemsForDay(items, day)
          const shown = dayItems.slice(0, 2)
          const extra = dayItems.length - shown.length

          if (!inMonth) {
            return (
              <div
                key={dateKey(day)}
                className="min-h-[58px] rounded-[11px] p-1.5 sm:min-h-[78px]"
              >
                <span className="font-fredoka text-[12.5px] font-semibold text-muted-foreground/55">
                  {day.getDate()}
                </span>
              </div>
            )
          }

          return (
            <Link
              key={dateKey(day)}
              href="/calendar"
              className={[
                'flex min-h-[58px] flex-col gap-1 rounded-[11px] border bg-card p-1.5 transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(58,46,34,.08)] sm:min-h-[78px]',
                isToday
                  ? 'border-[#D6498C] shadow-[0_0_0_1.5px_#D6498C_inset]'
                  : 'border-border hover:border-[rgba(164,141,120,.34)]',
              ].join(' ')}
            >
              <span
                className={[
                  'font-fredoka text-[12.5px] font-semibold',
                  isToday ? 'text-[#A82C66]' : 'text-foreground',
                ].join(' ')}
              >
                {day.getDate()}
              </span>
              <div className="flex flex-row flex-wrap gap-1 sm:flex-col sm:flex-nowrap">
                {shown.map((it) => {
                  const cat = getCategory(it.category)
                  return (
                    <span
                      key={it.id}
                      className="flex items-center gap-1.5 overflow-hidden font-fredoka text-[10.5px] font-medium leading-tight"
                      title={it.title}
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="hidden truncate sm:inline">{it.title}</span>
                    </span>
                  )
                })}
                {extra > 0 && (
                  <span className="hidden font-fredoka text-[10px] font-medium text-muted-foreground sm:inline">
                    +{extra} more
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 border-t border-border px-5 py-3.5">
        {LEGEND_KEYS.map((key) => {
          const cat = getCategory(key)
          return (
            <span key={key} className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
