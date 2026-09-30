export interface SharePercents {
  rider: number
  owner: number
  asarion: number
}

export interface SplitResult {
  rider: number
  owner: number
  asarion: number
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Split total using percents; Asarion share absorbs rounding so parts sum to total. */
export function splitAmount(total: number, shares: SharePercents): SplitResult {
  const safeTotal = Number.isFinite(total) ? total : 0
  const rider = round2((safeTotal * shares.rider) / 100)
  const owner = round2((safeTotal * shares.owner) / 100)
  const asarion = round2(safeTotal - rider - owner)
  return { rider, owner, asarion }
}

export function sharesTotal(shares: SharePercents): number {
  return round2(shares.rider + shares.owner + shares.asarion)
}
