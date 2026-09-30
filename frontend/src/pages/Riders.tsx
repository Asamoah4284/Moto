import { useState, type FormEvent } from 'react'
import { EmptyState } from '../components/KpiCard'
import { useApp } from '../context/AppContext'

export function RidersPage() {
  const { riders, addRider, updateRider } = useApp()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const list = riders
    .filter((r) => (showInactive ? true : r.active))
    .sort((a, b) => a.name.localeCompare(b.name))

  function reset() {
    setName('')
    setPhone('')
    setEditingId(null)
    setError('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError('')
    try {
      if (editingId) {
        await updateRider(editingId, {
          name: name.trim(),
          phone,
        })
      } else {
        await addRider({
          name: name.trim(),
          phone,
        })
      }
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save rider')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(id: string) {
    const rider = riders.find((r) => r.id === id)
    if (!rider) return
    setEditingId(id)
    setName(rider.name)
    setPhone(rider.phone ?? '')
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Riders</h1>
          <p className="page-sub">Manage active riders who remit cash.</p>
        </div>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </header>

      <div className="split-layout">
        <form className="panel form-panel" onSubmit={onSubmit}>
          <h2>{editingId ? 'Edit rider' : 'Add rider'}</h2>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Rider name"
            />
          </label>
          <label className="field">
            <span>Phone (optional)</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0XX…"
              inputMode="tel"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save rider' : 'Add rider'}
            </button>
            {editingId ? (
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>All riders</h2>
          </div>
          {list.length === 0 ? (
            <EmptyState title="No riders yet">
              <p>Add the first rider to start recording remittances.</p>
            </EmptyState>
          ) : (
            <>
              <ul className="card-list mobile-only">
                {list.map((r) => (
                  <li key={r.id} className={r.active ? undefined : 'row-muted'}>
                    <div className="card-list-main">
                      <strong>{r.name}</strong>
                      <span className="muted small">{r.phone || 'No phone'}</span>
                      <span
                        className={
                          r.active ? 'badge badge-good' : 'badge badge-muted'
                        }
                      >
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
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
                        className="btn btn-tiny"
                        onClick={() => updateRider(r.id, { active: !r.active })}
                      >
                        {r.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="table-wrap desktop-only">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => (
                      <tr
                        key={r.id}
                        className={r.active ? undefined : 'row-muted'}
                      >
                        <td>{r.name}</td>
                        <td>{r.phone || '—'}</td>
                        <td>
                          <span
                            className={
                              r.active ? 'badge badge-good' : 'badge badge-muted'
                            }
                          >
                            {r.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
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
                            className="btn btn-tiny"
                            onClick={() =>
                              updateRider(r.id, { active: !r.active })
                            }
                          >
                            {r.active ? 'Deactivate' : 'Activate'}
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
