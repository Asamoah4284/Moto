import { useMemo, useState } from 'react'
import { EmptyState } from '../components/KpiCard'
import { useApp } from '../context/AppContext'
import { formatDisplayDate, isWithinRange, todayISO } from '../utils/dates'
import { formatMoney } from '../utils/money'

export function HistoryPage() {
  const { meta, riders, remittances } = useApp()
  const currency = meta.currency
  const [riderId, setRiderId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(todayISO())

  const riderName = useMemo(() => {
    const map = new Map(riders.map((r) => [r.id, r.name]))
    return (id: string) => map.get(id) ?? 'Unknown'
  }, [riders])

  const rows = useMemo(() => {
    return remittances
      .filter((r) => (riderId ? r.riderId === riderId : true))
      .filter((r) => isWithinRange(r.date, from || undefined, to || undefined))
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      )
  }, [remittances, riderId, from, to])

  const totalActual = rows.reduce((sum, r) => sum + r.actual, 0)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-sub">Filter remittances by rider and date range.</p>
        </div>
      </header>

      <section className="panel filters-panel">
        <div className="filters">
          <label className="field">
            <span>Rider</span>
            <select
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
            >
              <option value="">All riders</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="field">
            <span>To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost filter-reset"
            onClick={() => {
              setRiderId('')
              setFrom('')
              setTo(todayISO())
            }}
          >
            Reset
          </button>
        </div>
        <p className="filter-summary muted">
          {rows.length} entries · Cash in {formatMoney(totalActual, currency)}
        </p>
      </section>

      <section className="panel">
        {rows.length === 0 ? (
          <EmptyState title="No matching remittances" />
        ) : (
          <>
            <ul className="card-list mobile-only">
              {rows.map((r) => (
                <li key={r.id}>
                  <div className="card-list-main">
                    <strong>{riderName(r.riderId)}</strong>
                    <span className="muted small">
                      {formatDisplayDate(r.date)} · {r.recordedBy}
                    </span>
                    {r.note ? (
                      <span className="muted small">{r.note}</span>
                    ) : null}
                  </div>
                  <div className="activity-amounts">
                    <span>{formatMoney(r.actual, currency)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="table-wrap desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Rider</th>
                    <th>Cash</th>
                    <th>Note</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDisplayDate(r.date)}</td>
                      <td>{riderName(r.riderId)}</td>
                      <td>{formatMoney(r.actual, currency)}</td>
                      <td>{r.note || '—'}</td>
                      <td className="capitalize">{r.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
