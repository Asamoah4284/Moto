import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, KpiCard } from '../components/KpiCard'
import { MotoLogo } from '../components/MotoLogo'
import { useApp } from '../context/AppContext'
import { formatDisplayDate, endOfWeekISO, startOfWeekISO, todayISO } from '../utils/dates'
import { splitAmount } from '../utils/finance'
import { formatMoney } from '../utils/money'
import './OwnerDashboard.css'

function summarize(amounts: { actual: number }[]) {
  let actual = 0
  for (const row of amounts) {
    actual += row.actual
  }
  return { actual, count: amounts.length }
}

export function OwnerDashboard() {
  const { meta, riders, remittances, currentPayout, issuePayout } = useApp()
  const currency = meta.currency
  const today = todayISO()
  const weekStart = startOfWeekISO()
  const weekEnd = endOfWeekISO()
  const [payoutBusy, setPayoutBusy] = useState(false)
  const [payoutMsg, setPayoutMsg] = useState('')
  const [payoutError, setPayoutError] = useState('')
  const weekIssued = Boolean(currentPayout?.issued)
  const weekComplete = Boolean(currentPayout?.weekComplete)
  const canIssueCurrent = Boolean(currentPayout?.canIssue)
  const prev = currentPayout?.previousWeek
  const canIssuePrevious = Boolean(prev?.canIssue)
  const payableWeekStart = canIssuePrevious
    ? prev?.weekStart
    : canIssueCurrent
      ? currentPayout?.weekStart
      : undefined
  const payableLabel =
    canIssuePrevious && prev
      ? `${formatDisplayDate(prev.weekStart)} – ${formatDisplayDate(prev.weekEnd)}`
      : `${formatDisplayDate(weekStart)} – ${formatDisplayDate(weekEnd)}`
  const shares = {
    rider: meta.riderSharePct,
    owner: meta.ownerSharePct,
    asarion: meta.asarionSharePct,
  }

  const riderName = useMemo(() => {
    const map = new Map(riders.map((r) => [r.id, r.name]))
    return (id: string) => map.get(id) ?? 'Unknown rider'
  }, [riders])

  const todayRows = remittances.filter((r) => r.date === today)
  const weekRows = remittances.filter(
    (r) => r.date >= weekStart && r.date <= weekEnd,
  )
  const todayStats = summarize(todayRows)
  const weekStats = summarize(weekRows)
  const allStats = summarize(remittances)

  const perRider = useMemo(() => {
    const map = new Map<string, { name: string; actual: number; count: number }>()
    for (const r of remittances) {
      const existing = map.get(r.riderId) ?? {
        name: riderName(r.riderId),
        actual: 0,
        count: 0,
      }
      existing.actual += r.actual
      existing.count += 1
      map.set(r.riderId, existing)
    }
    return [...map.values()].sort((a, b) => b.actual - a.actual)
  }, [remittances, riderName])

  const weekFinances = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string
        name: string
        remitted: number
        riderPay: number
        ownerShare: number
        asarionShare: number
      }
    >()
    for (const r of weekRows) {
      const existing = map.get(r.riderId) ?? {
        id: r.riderId,
        name: riderName(r.riderId),
        remitted: 0,
        riderPay: 0,
        ownerShare: 0,
        asarionShare: 0,
      }
      existing.remitted += r.actual
      map.set(r.riderId, existing)
    }
    const rows = [...map.values()].map((row) => {
      const split = splitAmount(row.remitted, shares)
      return {
        ...row,
        riderPay: split.rider,
        ownerShare: split.owner,
        asarionShare: split.asarion,
      }
    })
    rows.sort((a, b) => b.remitted - a.remitted)

    const totals = rows.reduce(
      (acc, row) => {
        acc.remitted += row.remitted
        acc.riderPay += row.riderPay
        acc.ownerShare += row.ownerShare
        acc.asarionShare += row.asarionShare
        return acc
      },
      { remitted: 0, riderPay: 0, ownerShare: 0, asarionShare: 0 },
    )

    return { rows, totals }
  }, [weekRows, riderName, shares.rider, shares.owner, shares.asarion])

  const recent = remittances
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  const remitted = Math.max(weekFinances.totals.remitted, 0.0001)

  async function onIssuePayout() {
    if (!payableWeekStart) return
    const ok = window.confirm(
      `Issue payout for ${payableLabel}?\n\n` +
        `This freezes that week’s split (rider / moto owner / ${meta.asarionName}) and saves it to payout history.`,
    )
    if (!ok) return
    setPayoutBusy(true)
    setPayoutError('')
    setPayoutMsg('')
    try {
      await issuePayout(undefined, payableWeekStart)
      setPayoutMsg('Payout issued. That week is now marked paid.')
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Could not issue payout')
    } finally {
      setPayoutBusy(false)
    }
  }

  return (
    <div className="page dash">
      <section className="dash-hero">
        <div className="dash-hero-copy">
          <div className="dash-hero-brand">
            <MotoLogo className="dash-hero-logo" />
            <div>
              <p className="dash-kicker">Owner control room</p>
              <h1 className="dash-title">{meta.businessName}</h1>
            </div>
          </div>
          <p className="dash-lead">
            Live remittance health for {formatDisplayDate(today)}. Weekly
            cash is auto-split across rider pay, moto owner, and{' '}
            {meta.asarionName}.
          </p>
          <div className="dash-hero-meta">
            <span className="dash-pill">
              Week {formatDisplayDate(weekStart)} – {formatDisplayDate(weekEnd)}
            </span>
            <span className="dash-pill dash-pill-soft">
              {weekStats.count} entries this week
            </span>
          </div>
        </div>
        <div className="dash-hero-stat">
          <p className="dash-hero-stat-label">This week remitted</p>
          <p className="dash-hero-stat-value">
            {formatMoney(weekStats.actual, currency)}
          </p>
          <div className="dash-hero-stat-row">
            <span>Today {formatMoney(todayStats.actual, currency)}</span>
            <span>All-time {formatMoney(allStats.actual, currency)}</span>
          </div>
        </div>
      </section>

      <section className="dash-bento">
        <KpiCard
          label="Today remitted"
          value={formatMoney(todayStats.actual, currency)}
          hint={`${todayStats.count} entries logged`}
          featured
        />
        <KpiCard
          label="This week"
          value={formatMoney(weekStats.actual, currency)}
          hint={`${weekStats.count} entries`}
        />
        <KpiCard
          label="All-time cash in"
          value={formatMoney(allStats.actual, currency)}
          hint={`${allStats.count} total entries`}
        />
        <KpiCard
          label="Active riders"
          value={String(riders.filter((r) => r.active).length)}
          hint={`${riders.length} total in system`}
        />
      </section>

      <section className="dash-finance panel">
        <div className="panel-head">
          <div>
            <p className="dash-kicker">Detailed finances</p>
            <h2>Weekly revenue split</h2>
          </div>
          <div className="dash-finance-actions">
            {weekIssued ? (
              <span className="payout-badge">Paid this week</span>
            ) : !weekComplete ? (
              <span className="payout-badge payout-badge-wait">
                Opens Friday
              </span>
            ) : null}
            <Link to="/settings" className="btn btn-ghost btn-compact">
              Edit shares
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-compact"
              disabled={payoutBusy || (!canIssueCurrent && !canIssuePrevious)}
              onClick={() => void onIssuePayout()}
              title={
                canIssuePrevious
                  ? `Issue previous week (${payableLabel})`
                  : weekComplete
                    ? 'Issue this week’s payout'
                    : 'Available from Friday when the week ends'
              }
            >
              {payoutBusy
                ? 'Issuing…'
                : canIssuePrevious
                  ? 'Issue previous week'
                  : weekIssued
                    ? 'Payout issued'
                    : !weekComplete
                      ? 'Waiting for week end'
                      : weekFinances.totals.remitted <= 0
                        ? 'No remittances yet'
                        : 'Issue payout'}
            </button>
          </div>
        </div>

        {canIssuePrevious && prev ? (
          <p className="payout-banner payout-banner-warn">
            Previous week ({formatDisplayDate(prev.weekStart)} –{' '}
            {formatDisplayDate(prev.weekEnd)}) is complete and unpaid. Issue that
            payout before closing this week.
          </p>
        ) : weekIssued ? (
          <p className="payout-banner payout-banner-ok">
            This week’s payout is locked in history.{' '}
            <Link to="/payouts" className="text-link">
              View payouts
            </Link>
            {currentPayout?.payout?.issuedAt
              ? ` · issued ${formatDisplayDate(currentPayout.payout.issuedAt.slice(0, 10))}`
              : ''}
          </p>
        ) : !weekComplete ? (
          <p className="muted small finance-note">
            Issue payout unlocks on <strong>Friday</strong> when this week ends (
            {formatDisplayDate(weekEnd)}). Until then the split is a live preview
            only.
          </p>
        ) : (
          <p className="muted small finance-note">
            This week is complete. Issuing payout freezes the Saturday–Friday split
            for records. Later remittances won’t change an issued payout.
          </p>
        )}
        {payoutMsg ? <p className="form-success">{payoutMsg}</p> : null}
        {payoutError ? <p className="form-error">{payoutError}</p> : null}

        <div className="share-track" aria-hidden>
          <span
            className="share-seg share-rider"
            style={{ width: `${meta.riderSharePct}%` }}
          />
          <span
            className="share-seg share-owner"
            style={{ width: `${meta.ownerSharePct}%` }}
          />
          <span
            className="share-seg share-asarion"
            style={{ width: `${meta.asarionSharePct}%` }}
          />
        </div>
        <div className="share-legend">
          <span>
            <i className="dot dot-rider" /> Rider {meta.riderSharePct}%
          </span>
          <span>
            <i className="dot dot-owner" /> Moto owner {meta.ownerSharePct}%
          </span>
          <span>
            <i className="dot dot-asarion" /> {meta.asarionName}{' '}
            {meta.asarionSharePct}%
          </span>
        </div>

        <div className="share-grid">
          <article className="share-card">
            <p className="share-card-label">Week remitted</p>
            <p className="share-card-value">
              {formatMoney(weekFinances.totals.remitted, currency)}
            </p>
          </article>
          <article className="share-card share-card-rider">
            <p className="share-card-label">Rider pay</p>
            <p className="share-card-value">
              {formatMoney(weekFinances.totals.riderPay, currency)}
            </p>
            <p className="share-card-hint">
              {((weekFinances.totals.riderPay / remitted) * 100).toFixed(0)}% of
              week
            </p>
          </article>
          <article className="share-card share-card-owner">
            <p className="share-card-label">Moto owner</p>
            <p className="share-card-value">
              {formatMoney(weekFinances.totals.ownerShare, currency)}
            </p>
            <p className="share-card-hint">
              {((weekFinances.totals.ownerShare / remitted) * 100).toFixed(0)}% of
              week
            </p>
          </article>
          <article className="share-card share-card-asarion">
            <p className="share-card-label">{meta.asarionName}</p>
            <p className="share-card-value">
              {formatMoney(weekFinances.totals.asarionShare, currency)}
            </p>
            <p className="share-card-hint">Maintenance & other</p>
          </article>
        </div>

        {weekFinances.rows.length === 0 ? (
          <EmptyState title="No remittances this week yet" />
        ) : (
          <>
            <ul className="card-list mobile-only">
              {weekFinances.rows.map((row) => (
                <li key={row.id}>
                  <div className="card-list-main">
                    <strong>{row.name}</strong>
                    <span className="muted small">
                      Remitted {formatMoney(row.remitted, currency)}
                    </span>
                    <div className="mini-track" aria-hidden>
                      <span
                        style={{ width: `${meta.riderSharePct}%` }}
                        className="share-seg share-rider"
                      />
                      <span
                        style={{ width: `${meta.ownerSharePct}%` }}
                        className="share-seg share-owner"
                      />
                      <span
                        style={{ width: `${meta.asarionSharePct}%` }}
                        className="share-seg share-asarion"
                      />
                    </div>
                    <span className="small">
                      Rider {formatMoney(row.riderPay, currency)} · Owner{' '}
                      {formatMoney(row.ownerShare, currency)} ·{' '}
                      {meta.asarionName} {formatMoney(row.asarionShare, currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="table-wrap desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Week remitted</th>
                    <th>Rider pay</th>
                    <th>Moto owner</th>
                    <th>{meta.asarionName}</th>
                  </tr>
                </thead>
                <tbody>
                  {weekFinances.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.name}</strong>
                      </td>
                      <td>{formatMoney(row.remitted, currency)}</td>
                      <td className="text-good">
                        {formatMoney(row.riderPay, currency)}
                      </td>
                      <td>{formatMoney(row.ownerShare, currency)}</td>
                      <td>{formatMoney(row.asarionShare, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="dash-split">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="dash-kicker">Performance</p>
              <h2>Per rider</h2>
            </div>
          </div>
          {perRider.length === 0 ? (
            <EmptyState title="No remittances yet">
              <p>Ask the manager to record today’s rider cash-ins.</p>
            </EmptyState>
          ) : (
            <div className="rider-stack">
              {perRider.map((row, index) => {
                const max = perRider[0]?.actual || 1
                const width = Math.max(8, (row.actual / max) * 100)
                return (
                  <article key={row.name} className="rider-row">
                    <div className="rider-row-top">
                      <div className="rider-rank">{index + 1}</div>
                      <div className="rider-meta">
                        <strong>{row.name}</strong>
                        <span className="muted small">{row.count} entries</span>
                      </div>
                      <div className="rider-amount">
                        {formatMoney(row.actual, currency)}
                      </div>
                    </div>
                    <div className="rider-bar">
                      <span style={{ width: `${width}%` }} />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="dash-kicker">Pulse</p>
              <h2>Recent activity</h2>
            </div>
            <Link to="/history" className="text-link">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="Nothing recorded yet" />
          ) : (
            <ul className="activity-list dash-activity">
              {recent.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{riderName(r.riderId)}</strong>
                    <span className="muted"> · {formatDisplayDate(r.date)}</span>
                  </div>
                  <div className="activity-amounts">
                    <span>{formatMoney(r.actual, currency)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  )
}
