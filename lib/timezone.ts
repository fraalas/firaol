export const APP_TIMEZONE = 'Africa/Addis_Ababa'

/**
 * Today's date as YYYY-MM-DD in Ethiopian local time (EAT, UTC+3),
 * regardless of the device's own timezone setting.
 */
export function getEATDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

/** Formats an ISO timestamp as a time string (e.g. "2:30 PM") in EAT. */
export function formatEATTime(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

/** Formats an ISO timestamp as date + time (e.g. "Jul 14, 2:30 PM") in EAT. */
export function formatEATDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

/** Formats a Date as a full weekday/date string (e.g. "Tuesday, July 14") in EAT. */
export function formatEATFullDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'long', month: 'long', day: 'numeric',
  }).format(date)
}

/**
 * Builds a correct UTC ISO timestamp from a date + time-of-day picked
 * in the EAT timezone (used for manual admin entry, since EAT is UTC+3
 * with no DST, the offset is always fixed).
 */
export function eatDateTimeToISO(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00+03:00`
}