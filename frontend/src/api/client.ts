const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function getToken(): string | null {
  try {
    const raw = sessionStorage.getItem('moto-remittance-session')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === 'string' ? data.error : 'Request failed',
      res.status,
    )
  }
  return data as T
}
