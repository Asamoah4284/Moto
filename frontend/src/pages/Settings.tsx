import { useMemo, useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import { sharesTotal } from '../utils/finance'

export function SettingsPage() {
  const { meta, updateMeta } = useApp()
  const [businessName, setBusinessName] = useState(meta.businessName)
  const [currency, setCurrency] = useState(meta.currency || 'GHS')
  const [ownerPin, setOwnerPin] = useState('')
  const [managerPin, setManagerPin] = useState('')
  const [riderSharePct, setRiderSharePct] = useState(String(meta.riderSharePct))
  const [ownerSharePct, setOwnerSharePct] = useState(String(meta.ownerSharePct))
  const [asarionSharePct, setAsarionSharePct] = useState(
    String(meta.asarionSharePct),
  )
  const [asarionName, setAsarionName] = useState(meta.asarionName)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const shareSum = useMemo(
    () =>
      sharesTotal({
        rider: Number(riderSharePct) || 0,
        owner: Number(ownerSharePct) || 0,
        asarion: Number(asarionSharePct) || 0,
      }),
    [riderSharePct, ownerSharePct, asarionSharePct],
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const rider = Number(riderSharePct)
    const owner = Number(ownerSharePct)
    const asarion = Number(asarionSharePct)
    if (![rider, owner, asarion].every((n) => Number.isFinite(n) && n >= 0)) {
      setError('Share percentages must be valid numbers (0 or more).')
      return
    }
    if (Math.abs(sharesTotal({ rider, owner, asarion }) - 100) >= 0.01) {
      setError('Rider, moto owner, and Asarion shares must add up to 100%.')
      return
    }

    setBusy(true)
    setError('')
    try {
      await updateMeta({
        businessName: businessName.trim() || meta.businessName,
        currency: currency.trim() || 'GHS',
        riderSharePct: rider,
        ownerSharePct: owner,
        asarionSharePct: asarion,
        asarionName: asarionName.trim() || meta.asarionName,
        ...(ownerPin.trim() ? { ownerPin: ownerPin.trim() } : {}),
        ...(managerPin.trim() ? { managerPin: managerPin.trim() } : {}),
      })
      setOwnerPin('')
      setManagerPin('')
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">
            Business details, weekly finance shares, and role PINs. Leave PIN
            fields blank to keep the current ones.
          </p>
        </div>
      </header>

      <form className="panel form-panel narrow" onSubmit={onSubmit}>
        <label className="field">
          <span>Business name</span>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Currency code</span>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            required
          />
        </label>

        <h2 className="settings-section-title">Weekly finance shares</h2>
        <p className="muted small">
          Applied to each rider’s remittances for the week. Must total 100%.
        </p>
        <label className="field">
          <span>Asarion display name</span>
          <input
            value={asarionName}
            onChange={(e) => setAsarionName(e.target.value)}
            required
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Rider pay %</span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={riderSharePct}
              onChange={(e) => setRiderSharePct(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Moto owner %</span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={ownerSharePct}
              onChange={(e) => setOwnerSharePct(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="field">
          <span>{asarionName.trim() || 'Asarion'} %</span>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={asarionSharePct}
            onChange={(e) => setAsarionSharePct(e.target.value)}
            required
          />
        </label>
        <p className={shareSum === 100 ? 'muted small' : 'form-error'}>
          Total: {shareSum}%{shareSum === 100 ? '' : ' (must be 100%)'}
        </p>

        <h2 className="settings-section-title">Security</h2>
        <label className="field">
          <span>New owner PIN (optional)</span>
          <input
            type="password"
            value={ownerPin}
            onChange={(e) => setOwnerPin(e.target.value)}
            placeholder="Leave blank to keep"
          />
        </label>
        <label className="field">
          <span>New manager PIN (optional)</span>
          <input
            type="password"
            value={managerPin}
            onChange={(e) => setManagerPin(e.target.value)}
            placeholder="Leave blank to keep"
          />
        </label>
        {saved ? <p className="form-success">Settings saved.</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
