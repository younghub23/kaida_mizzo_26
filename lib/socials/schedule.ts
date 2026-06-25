// Convert a wall-clock date + time in a named IANA timezone to a UTC ISO
// string, with no external date library. Used by the post/email schedulers so
// "9:00 AM PHT" lands at the correct absolute instant regardless of server tz.

function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  // 'hour' can come back as '24' at midnight in some environments.
  const hour = map.hour === '24' ? '0' : map.hour
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(hour),
    Number(map.minute),
    Number(map.second)
  )
  return asUTC - date.getTime()
}

/**
 * @param dateStr 'YYYY-MM-DD'
 * @param timeStr 'HH:MM' (24h)
 * @param timeZone IANA tz, e.g. 'Asia/Manila'
 * @returns UTC ISO string for that local instant
 */
export function zonedToUtcIso(dateStr: string, timeStr: string, timeZone: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const wallUtc = Date.UTC(y, m - 1, d, hh, mm)

  // Two-pass offset resolution handles DST boundaries correctly.
  let offset = tzOffsetMs(new Date(wallUtc), timeZone)
  let utc = wallUtc - offset
  offset = tzOffsetMs(new Date(utc), timeZone)
  utc = wallUtc - offset

  return new Date(utc).toISOString()
}
