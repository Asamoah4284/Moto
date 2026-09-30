export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfWeekISO(date = new Date()): string {
  const d = new Date(date)
  // Week starts on Saturday (JS: Sun=0 ... Sat=6)
  const day = d.getDay()
  const daysSinceSaturday = (day + 1) % 7
  d.setDate(d.getDate() - daysSinceSaturday)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dayNum = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dayNum}`
}

/** Inclusive end of the Saturday-based week (Friday). */
export function endOfWeekISO(date = new Date()): string {
  const start = startOfWeekISO(date)
  const [y, m, d] = start.split('-').map(Number)
  const end = new Date(y, m - 1, d)
  end.setDate(end.getDate() + 6)
  const yy = end.getFullYear()
  const mm = String(end.getMonth() + 1).padStart(2, '0')
  const dd = String(end.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function isWithinRange(
  isoDate: string,
  from?: string,
  to?: string,
): boolean {
  if (from && isoDate < from) return false
  if (to && isoDate > to) return false
  return true
}
