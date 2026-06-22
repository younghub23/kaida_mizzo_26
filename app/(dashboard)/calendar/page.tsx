import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCalendarEvents, getTodos } from '@/app/actions/calendar'
import { getPosts } from '@/app/actions/social'
import { CalendarClient } from './calendar-client'

export default async function CalendarPage() {
  // Server-side auth guard, mirroring the other dashboard pages.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all calendar sources in parallel. Scheduled posts are merged in
  // read-only; user events and to-dos are editable.
  const [events, posts, todos] = await Promise.all([
    getCalendarEvents(),
    getPosts(),
    getTodos(),
  ])

  return <CalendarClient initialEvents={events} initialPosts={posts} initialTodos={todos} />
}
