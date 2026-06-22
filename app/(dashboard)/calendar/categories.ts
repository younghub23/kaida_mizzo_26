// Color-coding categories for the calendar. These power the "MORE INFO" legend,
// the event pill colors, and the category picker in the Add/Edit Event dialog.
//
// `social` is reserved for events auto-imported from scheduled_posts (read-only).
// The rest are freely chosen by the user when they add their own events.
//
// Colors are stored as hex so they render reliably via inline styles regardless
// of Tailwind's class purging. The brand pass can later remap these to tokens.

export type CategoryKey =
  | 'social'
  | 'email'
  | 'content'
  | 'personal'
  | 'work'
  | 'other'

export type Category = {
  key: CategoryKey
  label: string
  /** Strong color for pill backgrounds / legend swatches. */
  color: string
  /** Soft tint for day-cell event pills (Google-Calendar style). */
  tint: string
  /** Text color that sits legibly on the tint. */
  text: string
}

export const CATEGORIES: Category[] = [
  { key: 'social', label: 'Social posts', color: '#C13A77', tint: '#F7E2EE', text: '#8A2456' },
  { key: 'email', label: 'Email', color: '#D97706', tint: '#FBEDD9', text: '#92520A' },
  { key: 'content', label: 'Content / AI plan', color: '#7C3AED', tint: '#ECE3FB', text: '#5B27B0' },
  { key: 'personal', label: 'Personal', color: '#059669', tint: '#D9F2E9', text: '#046C4E' },
  { key: 'work', label: 'Work', color: '#0284C7', tint: '#DBEEFB', text: '#055f93' },
  { key: 'other', label: 'Other', color: '#64748B', tint: '#E7EAEE', text: '#475569' },
]

// Categories the user can pick when creating an event. `social` is excluded
// because that color is reserved for auto-imported scheduled posts.
export const SELECTABLE_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'social')

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]))

export function getCategory(key: string): Category {
  return CATEGORY_MAP.get(key as CategoryKey) ?? CATEGORIES[CATEGORIES.length - 1]
}
