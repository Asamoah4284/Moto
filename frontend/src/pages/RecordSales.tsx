import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/KpiCard'
import { useApp } from '../context/AppContext'
import { formatDisplayDate, todayISO } from '../utils/dates'
import { formatMoney, parseMoneyInput } from '../utils/money'

export function RecordSalesPage() {
  const {
    meta,
    riders,
    remittances,
    addRemittance,
    updateRemittance,
    deleteRemittance,
  } = useApp()
  const currency = meta.currency
  const activeRiders = riders.filter((r) => r.active)
  const today = todayISO()

  const [riderId, setRiderId] = useState(activeRiders[0]?.id ?? '')
  const [date, setDate] = useState(today)
  const [actual, setActual] = useState('')
  const [note, setNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const dayRows = useMemo(
    () =>
      remittances
        .filter((r) => r.date === date)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [remittances, date],
  )

  const riderName = useMemo(() => {
    const map = new Map(riders.map((r) => [r.id, r.name]))
    return (id: string) => map.get(id) ?? 'Unknown'
  }, [riders])

  function resetForm() {
    setEditingId(null)
    setActual('')
    setNote('')
    setRiderId(activeRiders[0]?.id ?? '')
    setDate(today)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!riderId) {
      setMessage('Add a rider first.')
      return
    }
    const actualNum = parseMoneyInput(actual)
    setBusy(true)
    try {
      if (editingId) {
        await updateRemittance(editingId, {
          riderId,
          date,
          actual: actualNum,
          note,
        })
        setMessage('Entry updated.')
      } else {
        await addRemittance({
          riderId,
          date,
          actual: actualNum,
          note,
        })
        setMessage('Remittance recorded.')
      }
      resetForm()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(id: string) {
    const row = remittances.find((r) => r.id === id)
    if (!row) return
    setEditingId(id)
    setRiderId(row.riderId)
    setDate(row.date)
    setActual(String(row.actual))
    setNote(row.note ?? '')
    setMessage('')
  }

  if (activeRiders.length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Record remittance</h1>
            <p className="page-sub">Log rider cash brought in for the day.</p>
          </div>
        </header>
        <EmptyState title="No active riders">
          <p>
            <Link to="/riders" className="text-link">
              Add riders
            </Link>{' '}
            before recording sales.
          </p>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Record remittance</h1>
          <p className="page-sub">
            Log the cash each rider brings in (GHS).
          </p>
        </div>
      </header>

      <div className="split-layout">
        <form className="panel form-panel" onSubmit={onSubmit}>
          <h2>{editingId ? 'Edit entry' : 'New entry'}</h2>

          <label className="field">
            <span>Rider</span>
            <select
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
              required
            >
              {activeRiders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Cash brought (GHS)</span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Note (optional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Fuel, delay, etc."
            />
          </label>

          {message ? <p className="form-success">{message}</p> : null}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Save remittance'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetForm}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Entries for {formatDisplayDate(date)}</h2>
          </div>
          {dayRows.length === 0 ? (
            <EmptyState title="No entries for this date" />
          ) : (
            <>
              <ul className="card-list mobile-only">
                {dayRows.map((r) => (
                  <li key={r.id}>
                    <div className="card-list-main">
                      <strong>{riderName(r.riderId)}</strong>
                      <span>{formatMoney(r.actual, currency)}</span>
                      {r.note ? (
                        <span className="muted small">{r.note}</span>
                      ) : null}
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-tiny"
                        onClick={() => startEdit(r.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-tiny btn-danger"
                        onClick={async () => {
                          if (!confirm('Delete this entry?')) return
                          await deleteRemittance(r.id)
                          if (editingId === r.id) resetForm()
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="table-wrap desktop-only">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rider</th>
                      <th>Cash</th>
                      <th>Note</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {dayRows.map((r) => (
                      <tr key={r.id}>
                        <td>{riderName(r.riderId)}</td>
                        <td>{formatMoney(r.actual, currency)}</td>
                        <td>{r.note || '—'}</td>
                        <td className="row-actions">
                          <button
                            type="button"
                            className="btn btn-tiny"
                            onClick={() => startEdit(r.id)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-tiny btn-danger"
                            onClick={async () => {
                              if (!confirm('Delete this entry?')) return
                              await deleteRemittance(r.id)
                              if (editingId === r.id) resetForm()
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
