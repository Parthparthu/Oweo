import { format, isToday, isYesterday, parseISO } from 'date-fns'

/**
 * Formats an ISO date (YYYY-MM-DD) or timestamp into a friendly user string.
 * Example: "Today", "Yesterday", "23 Aug 2026"
 */
export function formatFriendlyDate(dateInput: string | number | Date): string {
  try {
    const d =
      typeof dateInput === 'string'
        ? parseISO(dateInput)
        : typeof dateInput === 'number'
        ? new Date(dateInput)
        : dateInput

    if (isToday(d)) return 'Today'
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'd MMM yyyy')
  } catch {
    return String(dateInput)
  }
}

/**
 * Formats a date into standard ISO YYYY-MM-DD format.
 */
export function toISODateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Returns Month and Year label (e.g. "August 2026")
 */
export function formatMonthYear(date: Date = new Date()): string {
  return format(date, 'MMMM yyyy')
}

/**
 * Returns Short Month label (e.g. "Aug '26")
 */
export function formatShortMonth(date: Date = new Date()): string {
  return format(date, "MMM ''yy")
}
