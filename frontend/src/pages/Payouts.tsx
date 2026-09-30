import { useMemo, useState } from 'react'
import { EmptyState } from '../components/KpiCard'
import { useApp } from '../context/AppContext'
import { formatDisplayDate } from '../utils/dates'
import { formatMoney } from '../utils/money'

export function PayoutsPage() {
  const { payouts, meta } = useApp()
  const [openId, setOpenId] = useState<string | null>(payouts[0]?.id ?? null)

  const selected = useMemo(
    () => payouts.find((p) => p.id === openId) ?? null,
    [payouts, openId],
  )

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Records</p>
          <h1 className="page-title">Payouts</h1>
          <p className="page-sub">
            Closed Saturday–Friday weeks. Each issued payout is a frozen snapshot
            of rider pay, moto owner share, and {meta.asarionName}.
          </p>
        </div>
      </header>

      {payouts.length === 0 ? (
        <EmptyState title="No payouts issued yet">
          <p>
            On the Owner dashboard, use <strong>Issue payout</strong> after the
            week’s remittances are in.
          </p>
        </EmptyState>
      ) : (
        <div className="split-layout">
          <section className="panel">
            <div className="panel-head">
              <h2>History</h2>
            </div>
            <ul className="payout-list">
              {payouts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={
                      openId === p.id
                        ? 'payout-list-btn active'
                        : 'payout-list-btn'
                    }
                    onClick={() => setOpenId(p.id)}
                  >
                    <strong>
                      {formatDisplayDate(p.weekStart)} –{' '}
                      {formatDisplayDate(p.weekEnd)}
                    </strong>
                    <span className="muted small">
                      {formatMoney(p.totalRemitted, p.currency)} ·{' '}
                      {p.lines.length} riders
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            {!selected ? (
              <EmptyState title="Select a payout" />
            ) : (
              <>
                <div className="panel-head">
                  <div>
                    <p className="page-eyebrow">Issued snapshot</p>
                    <h2>
                      {formatDisplayDate(selected.weekStart)} –{' '}
                      {formatDisplayDate(selected.weekEnd)}
                    </h2>
                  </div>
                  <span className="badge badge-good">Paid</span>
                </div>
                <p className="muted small">
                  Issued {new Date(selected.issuedAt).toLocaleString()} · Shares
                  Rider {selected.riderSharePct}% / Owner {selected.ownerSharePct}%
                  / {selected.asarionName} {selected.asarionSharePct}%
                </p>

                <div className="share-grid payout-totals">
                  <article className="share-card">
                    <p className="share-card-label">Remitted</p>
                    <p className="share-card-value">
                      {formatMoney(selected.totalRemitted, selected.currency)}
                    </p>
                  </article>
                  <article className="share-card share-card-rider">
                    <p className="share-card-label">Rider pay</p>
                    <p className="share-card-value">
                      {formatMoney(selected.totalRiderPay, selected.currency)}
                    </p>
                  </article>
                  <article className="share-card share-card-owner">
                    <p className="share-card-label">Moto owner</p>
                    <p className="share-card-value">
                      {formatMoney(selected.totalOwnerShare, selected.currency)}
                    </p>
                  </article>
                  <article className="share-card share-card-asarion">
                    <p className="share-card-label">{selected.asarionName}</p>
                    <p className="share-card-value">
                      {formatMoney(
                        selected.totalAsarionShare,
                        selected.currency,
                      )}
                    </p>
                  </article>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rider</th>
                        <th>Remitted</th>
                        <th>Rider pay</th>
                        <th>Moto owner</th>
                        <th>{selected.asarionName}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lines.map((line) => (
                        <tr key={line.riderId}>
                          <td>{line.riderName}</td>
                          <td>
                            {formatMoney(line.remitted, selected.currency)}
                          </td>
                          <td className="text-good">
                            {formatMoney(line.riderPay, selected.currency)}
                          </td>
                          <td>
                            {formatMoney(line.ownerShare, selected.currency)}
                          </td>
                          <td>
                            {formatMoney(line.asarionShare, selected.currency)}
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
      )}
    </div>
  )
}
