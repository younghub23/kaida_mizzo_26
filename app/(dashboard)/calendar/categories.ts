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
  { key: 'social', label: 'Social posts', color: '#D6498C', tint: '#F9E4EE', text: '#A82C66' },
  { key: 'email', label: 'Email', color: '#F4C96D', tint: '#FBF0D2', text: '#9A6E16' },
  { key: 'content', label: 'Content / AI plan', color: '#36B7C0', tint: '#DCF1F2', text: '#1E7B82' },
  { key: 'personal', label: 'Personal', color: '#6E8F4F', tint: '#E8EFDB', text: '#4C6633' },
  { key: 'work', label: 'Work', color: '#9AC6E0', tint: '#E4F0F8', text: '#3A6E92' },
  { key: 'other', label: 'Other', color: '#F0B0A0', tint: '#FBE7E0', text: '#B5604A' },
]

// Categories the user can pick when creating an event. `social` is excluded
// because that color is reserved for auto-imported scheduled posts.
export const SELECTABLE_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'social')

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]))

export function getCategory(key: string): Category {
  return CATEGORY_MAP.get(key as CategoryKey) ?? CATEGORIES[CATEGORIES.length - 1]
}
