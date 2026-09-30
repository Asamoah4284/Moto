export type Role = 'owner' | 'manager'

export interface Rider {
  id: string
  name: string
  phone?: string
  active: boolean
  createdAt: string
}

export interface Remittance {
  id: string
  riderId: string
  date: string
  actual: number
  note?: string
  recordedBy: Role
  createdAt: string
}

export interface AppMeta {
  businessName: string
  currency: string
  riderSharePct: number
  ownerSharePct: number
  asarionSharePct: number
  asarionName: string
}

export interface PayoutLine {
  riderId: string
  riderName: string
  remitted: number
  riderPay: number
  ownerShare: number
  asarionShare: number
}

export interface Payout {
  id: string
  weekStart: string
  weekEnd: string
  riderSharePct: number
  ownerSharePct: number
  asarionSharePct: number
  asarionName: string
  currency: string
  totalRemitted: number
  totalRiderPay: number
  totalOwnerShare: number
  totalAsarionShare: number
  lines: PayoutLine[]
  note?: string
  issuedBy: Role
  issuedAt: string
  createdAt?: string
}

export interface CurrentPayoutStatus {
  today: string
  weekStart: string
  weekEnd: string
  weekComplete: boolean
  canIssue: boolean
  issued: boolean
  payout: Payout | null
  preview: {
    totalRemitted: number
    totalRiderPay: number
    totalOwnerShare: number
    totalAsarionShare: number
    lineCount: number
  }
  previousWeek: {
    weekStart: string
    weekEnd: string
    weekComplete: boolean
    issued: boolean
    canIssue: boolean
    payout: Payout | null
    preview: {
      totalRemitted: number
      totalRiderPay: number
      totalOwnerShare: number
      totalAsarionShare: number
      lineCount: number
    }
  }
}

export const SESSION_KEY = 'moto-remittance-session'

export const DEFAULT_META: AppMeta = {
  businessName: 'Moto Remit',
  currency: 'GHS',
  riderSharePct: 20,
  ownerSharePct: 30,
  asarionSharePct: 50,
  asarionName: 'Asarion',
}

export function normalizeMeta(raw: Partial<AppMeta> | null | undefined): AppMeta {
  return {
    businessName: raw?.businessName?.trim() || DEFAULT_META.businessName,
    currency: raw?.currency?.trim() || DEFAULT_META.currency,
    riderSharePct: Number.isFinite(Number(raw?.riderSharePct))
      ? Number(raw?.riderSharePct)
      : DEFAULT_META.riderSharePct,
    ownerSharePct: Number.isFinite(Number(raw?.ownerSharePct))
      ? Number(raw?.ownerSharePct)
      : DEFAULT_META.ownerSharePct,
    asarionSharePct: Number.isFinite(Number(raw?.asarionSharePct))
      ? Number(raw?.asarionSharePct)
      : DEFAULT_META.asarionSharePct,
    asarionName: raw?.asarionName?.trim() || DEFAULT_META.asarionName,
  }
}
