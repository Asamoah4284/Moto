import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { MotoLogo } from '../components/MotoLogo'
import { useApp } from '../context/AppContext'
import type { Role } from '../data/types'
import './Login.css'

export function LoginPage() {
  const { meta, role, ready, login, error, clearError } = useApp()
  const [selected, setSelected] = useState<Role>('manager')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')

  if (!ready) {
    return (
      <div className="boot-screen">
        <p>Loading Moto Remit…</p>
      </div>
    )
  }
  if (role === 'owner') return <Navigate to="/" replace />
  if (role === 'manager') return <Navigate to="/record" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    clearError()
    setLocalError('')
    setBusy(true)
    const ok = await login(selected, pin.trim())
    setBusy(false)
    if (!ok) setLocalError('Incorrect PIN or server unavailable.')
  }

  return (
    <div className="login-page">
      <div className="login-atmosphere" aria-hidden />
      <section className="login-panel">
        <div className="login-brand-row">
          <MotoLogo className="login-logo" />
          <div>
            <p className="login-eyebrow">Sales remittance · Ghana</p>
            <h1 className="login-brand">{meta.businessName}</h1>
          </div>
        </div>
        <p className="login-lead">
          Track rider cash-ins in Ghana Cedis. Managers record daily remittances;
          owners see weekly splits and payouts.
        </p>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="role-toggle" role="group" aria-label="Choose role">
            <button
              type="button"
              className={
                selected === 'manager' ? 'role-btn active' : 'role-btn'
              }
              onClick={() => setSelected('manager')}
            >
              Manager
            </button>
            <button
              type="button"
              className={selected === 'owner' ? 'role-btn active' : 'role-btn'}
              onClick={() => setSelected('owner')}
            >
              Owner
            </button>
          </div>

          <label className="field">
            <span>PIN</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={
                selected === 'manager' ? 'Default 1234' : 'Default 0000'
              }
              required
            />
          </label>

          {localError || error ? (
            <p className="form-error">{localError || error}</p>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={busy}
          >
            {busy ? 'Signing in…' : 'Enter dashboard'}
          </button>
        </form>
      </section>
    </div>
  )
}
