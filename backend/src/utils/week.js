/** Saturday-start week helpers (YYYY-MM-DD), matching the frontend. */

export function todayISO(date = new Date()) {
  return toISO(new Date(date))
}

export function startOfWeekISO(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const daysSinceSaturday = (day + 1) % 7
  d.setDate(d.getDate() - daysSinceSaturday)
  return toISO(d)
}

export function endOfWeekISO(date = new Date()) {
  return endOfWeekFromStart(startOfWeekISO(date))
}

export function endOfWeekFromStart(weekStart) {
  const [y, m, d] = weekStart.split('-').map(Number)
  const end = new Date(y, m - 1, d)
  end.setDate(end.getDate() + 6)
  return toISO(end)
}

/** The Saturday–Friday week before the current one. */
export function previousWeekRange(date = new Date()) {
  const currentStart = startOfWeekISO(date)
  const [y, m, d] = currentStart.split('-').map(Number)
  const prevFriday = new Date(y, m - 1, d)
  prevFriday.setDate(prevFriday.getDate() - 1)
  const weekStart = startOfWeekISO(prevFriday)
  return { weekStart, weekEnd: endOfWeekFromStart(weekStart) }
}

/** Week is up from its Friday onward (today >= weekEnd). */
export function isWeekComplete(weekEnd, date = new Date()) {
  return todayISO(date) >= weekEnd
}

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function splitAmount(total, shares) {
  const safeTotal = Number.isFinite(total) ? total : 0
  const rider = round2((safeTotal * shares.rider) / 100)
  const owner = round2((safeTotal * shares.owner) / 100)
  const asarion = round2(safeTotal - rider - owner)
  return { rider, owner, asarion }
}
