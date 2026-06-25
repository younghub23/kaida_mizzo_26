'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/log'

export type CalendarEvent = {
  id: string
  user_id: string
  title: string
  notes: string | null
  category: string
  start_at: string
  end_at: string | null
  all_day: boolean
  created_at: string
  updated_at: string
}

export type CalendarTodo = {
  id: string
  user_id: string
  title: string
  done: boolean
  due_date: string | null
  created_at: string
}

export type CalendarActionState = {
  error: string | null
  success: boolean
}

export type EventInput = {
  title: string
  notes?: string | null
  category: string
  start_at: string
  end_at?: string | null
  all_day?: boolean
}

// ── Events ────────────────────────────────────────────────────────────────

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .order('start_at', { ascending: true })

  if (error || !data) {
    if (error) logError('calendar/getCalendarEvents', 'Failed to fetch events', error, { userId: user.id })
    return []
  }

  return data as CalendarEvent[]
}

export async function createCalendarEvent(input: EventInput): Promise<CalendarActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  if (!input.title?.trim() || !input.start_at) {
    return { error: 'Please add a title and a start date/time', success: false }
  }

  const { error } = await supabase.from('calendar_events').insert({
    user_id: user.id,
    title: input.title.trim(),
    notes: input.notes?.trim() || null,
    category: input.category,
    start_at: input.start_at,
    end_at: input.end_at || null,
    all_day: input.all_day ?? false,
  })

  if (error) {
    logError('calendar/createCalendarEvent', 'Failed to insert event', error, { userId: user.id })
    return { error: error.message, success: false }
  }

  revalidatePath('/calendar')
  return { error: null, success: true }
}

export async function updateCalendarEvent(
  id: string,
  input: EventInput
): Promise<CalendarActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  if (!input.title?.trim() || !input.start_at) {
    return { error: 'Please add a title and a start date/time', success: false }
  }

  const { error } = await supabase
    .from('calendar_events')
    .update({
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      category: input.category,
      start_at: input.start_at,
      end_at: input.end_at || null,
      all_day: input.all_day ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    logError('calendar/updateCalendarEvent', 'Failed to update event', error, { userId: user.id, eventId: id })
    return { error: error.message, success: false }
  }

  revalidatePath('/calendar')
  return { error: null, success: true }
}

export async function deleteCalendarEvent(id: string): Promise<CalendarActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    logError('calendar/deleteCalendarEvent', 'Failed to delete event', error, { userId: user.id, eventId: id })
    return { error: error.message, success: false }
  }

  revalidatePath('/calendar')
  return { error: null, success: true }
}

// ── To-dos ──────────────────────────────────────────────────────────────────

export async function getTodos(): Promise<CalendarTodo[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('calendar_todos')
    .select('*')
    .eq('user_id', user.id)
    .order('done', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) {
    if (error) logError('calendar/getTodos', 'Failed to fetch todos', error, { userId: user.id })
    return []
  }

  return data as CalendarTodo[]
}

export async function createTodo(
  title: string,
  dueDate?: string | null
): Promise<CalendarActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  if (!title?.trim()) {
    return { error: 'Please enter a task', success: false }
  }

  const { error } = await supabase.from('calendar_todos').insert({
    user_id: user.id,
    title: title.trim(),
    due_date: dueDate || null,
  })

  if (error) {
    logError('calendar/createTodo', 'Failed to insert todo', error, { userId: user.id })
    return { error: error.message, success: false }
  }

  revalidatePath('/calendar')
  return { error: null, success: true }
}

export async function toggleTodo(id: string, done: boolean): Promise<CalendarActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const { error } = await supabase
    .from('calendar_todos')
    .update({ done })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    logError('calendar/toggleTodo', 'Failed to toggle todo', error, { userId: user.id, todoId: id })
    return { error: error.message, success: false }
  }

  revalidatePath('/calendar')
  return { error: null, success: true }
}

export async function updateTodo(id: string, title: string): Promise<CalendarActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const trimmed = title?.trim()
  if (!trimmed) return { error: 'Please enter a task', success: false }

  const { error } = await supabase
    .from('calendar_todos')
    .update({ title: trimmed })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    logError('calendar/updateTodo', 'Failed to update todo', error, { userId: user.id, todoId: id })
    return { error: error.message, success: false }
  }

  revalidatePath('/calendar')
  return { error: null, success: true }
}

export async function deleteTodo(id: string): Promise<CalendarActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  const { error } = await supabase
    .from('calendar_todos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    logError('calendar/deleteTodo', 'Failed to delete todo', error, { userId: user.id, todoId: id })
    return { error: error.message, success: false }
  }

  revalidatePath('/calendar')
  return { error: null, success: true }
}
