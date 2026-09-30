import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError } from '../api/client'
import {
  DEFAULT_META,
  SESSION_KEY,
  normalizeMeta,
  type AppMeta,
  type CurrentPayoutStatus,
  type Payout,
  type Remittance,
  type Rider,
  type Role,
} from '../data/types'

interface Session {
  role: Role
  token: string
}

type MetaPatch = Partial<AppMeta> & {
  ownerPin?: string
  managerPin?: string
}

interface AppContextValue {
  ready: boolean
  loading: boolean
  error: string
  clearError: () => void
  meta: AppMeta
  riders: Rider[]
  remittances: Remittance[]
  payouts: Payout[]
  currentPayout: CurrentPayoutStatus | null
  role: Role | null
  login: (role: Role, pin: string) => Promise<boolean>
  logout: () => void
  refresh: () => Promise<void>
  updateMeta: (patch: MetaPatch) => Promise<void>
  issuePayout: (note?: string, weekStart?: string) => Promise<Payout>
  addRider: (input: { name: string; phone?: string }) => Promise<void>
  updateRider: (
    id: string,
    patch: Partial<Pick<Rider, 'name' | 'phone' | 'active'>>,
  ) => Promise<void>
  addRemittance: (input: {
    riderId: string
    date: string
    actual: number
    note?: string
  }) => Promise<void>
  updateRemittance: (
    id: string,
    patch: Partial<Pick<Remittance, 'riderId' | 'date' | 'actual' | 'note'>>,
  ) => Promise<void>
  deleteRemittance: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (
      (parsed.role === 'owner' || parsed.role === 'manager') &&
      typeof parsed.token === 'string'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [meta, setMeta] = useState<AppMeta>(DEFAULT_META)
  const [riders, setRiders] = useState<Rider[]>([])
  const [remittances, setRemittances] = useState<Remittance[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [currentPayout, setCurrentPayout] =
    useState<CurrentPayoutStatus | null>(null)
  const [role, setRole] = useState<Role | null>(() => loadSession()?.role ?? null)

  const clearError = useCallback(() => setError(''), [])

  const logout = useCallback(() => {
    setRole(null)
    setRiders([])
    setRemittances([])
    setPayouts([])
    setCurrentPayout(null)
    setMeta(DEFAULT_META)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  const refresh = useCallback(async () => {
    const session = loadSession()
    if (!session) {
      setRole(null)
      setReady(true)
      return
    }
    setLoading(true)
    try {
      const [settings, nextRiders, nextRemittances, nextPayouts, nextCurrent] =
        await Promise.all([
          api<AppMeta>('/settings'),
          api<Rider[]>('/riders'),
          api<Remittance[]>('/remittances'),
          api<Payout[]>('/payouts'),
          api<CurrentPayoutStatus>('/payouts/current'),
        ])
      setMeta(normalizeMeta(settings))
      setRiders(nextRiders)
      setRemittances(nextRemittances)
      setPayouts(nextPayouts)
      setCurrentPayout(nextCurrent)
      setRole(session.role)
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    } finally {
      setLoading(false)
      setReady(true)
    }
  }, [logout])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (nextRole: Role, pin: string) => {
    try {
      const result = await api<{
        token: string
        role: Role
        settings: AppMeta
      }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ role: nextRole, pin }),
        },
        false,
      )
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ role: result.role, token: result.token }),
      )
      setRole(result.role)
      setMeta(normalizeMeta(result.settings))
      setError('')
      const [nextRiders, nextRemittances, nextPayouts, nextCurrent] =
        await Promise.all([
          api<Rider[]>('/riders'),
          api<Remittance[]>('/remittances'),
          api<Payout[]>('/payouts'),
          api<CurrentPayoutStatus>('/payouts/current'),
        ])
      setRiders(nextRiders)
      setRemittances(nextRemittances)
      setPayouts(nextPayouts)
      setCurrentPayout(nextCurrent)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      return false
    }
  }, [])

  const updateMeta = useCallback(async (patch: MetaPatch) => {
    const updated = await api<AppMeta>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setMeta(normalizeMeta(updated))
  }, [])

  const issuePayout = useCallback(async (note?: string, weekStart?: string) => {
    const payout = await api<Payout>('/payouts/issue', {
      method: 'POST',
      body: JSON.stringify({ note: note ?? '', weekStart }),
    })
    setPayouts((prev) => [payout, ...prev.filter((p) => p.id !== payout.id)])
    const nextCurrent = await api<CurrentPayoutStatus>('/payouts/current')
    setCurrentPayout(nextCurrent)
    return payout
  }, [])

  const addRider = useCallback(
    async (input: { name: string; phone?: string }) => {
      const rider = await api<Rider>('/riders', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setRiders((prev) =>
        [...prev, rider].sort((a, b) => a.name.localeCompare(b.name)),
      )
    },
    [],
  )

  const updateRider = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Rider, 'name' | 'phone' | 'active'>>,
    ) => {
      const rider = await api<Rider>(`/riders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setRiders((prev) =>
        prev
          .map((r) => (r.id === id ? rider : r))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
    },
    [],
  )

  const addRemittance = useCallback(
    async (input: {
      riderId: string
      date: string
      actual: number
      note?: string
    }) => {
      const row = await api<Remittance>('/remittances', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setRemittances((prev) => [row, ...prev])
    },
    [],
  )

  const updateRemittance = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Remittance, 'riderId' | 'date' | 'actual' | 'note'>>,
    ) => {
      const row = await api<Remittance>(`/remittances/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setRemittances((prev) => prev.map((r) => (r.id === id ? row : r)))
    },
    [],
  )

  const deleteRemittance = useCallback(async (id: string) => {
    await api<{ ok: boolean }>(`/remittances/${id}`, { method: 'DELETE' })
    setRemittances((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      ready,
      loading,
      error,
      clearError,
      meta,
      riders,
      remittances,
      payouts,
      currentPayout,
      role,
      login,
      logout,
      refresh,
      updateMeta,
      issuePayout,
      addRider,
      updateRider,
      addRemittance,
      updateRemittance,
      deleteRemittance,
    }),
    [
      ready,
      loading,
      error,
      clearError,
      meta,
      riders,
      remittances,
      payouts,
      currentPayout,
      role,
      login,
      logout,
      refresh,
      updateMeta,
      issuePayout,
      addRider,
      updateRider,
      addRemittance,
      updateRemittance,
      deleteRemittance,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
