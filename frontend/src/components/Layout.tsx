import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { MotoLogo } from './MotoLogo'
import './Layout.css'

const ICONS: Record<string, string> = {
  Dashboard: 'M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z',
  History: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2',
  Payouts: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  Riders: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 20v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1',
  Record: 'M8 3h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v5h5M9 13h6M9 17h6',
  Settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
}

export function Layout() {
  const { meta, role, logout, loading, error, clearError } = useApp()

  const links =
    role === 'owner'
      ? [
          { to: '/', label: 'Dashboard', end: true },
          { to: '/payouts', label: 'Payouts' },
          { to: '/history', label: 'History' },
          { to: '/riders', label: 'Riders' },
          { to: '/record', label: 'Record' },
          { to: '/settings', label: 'Settings' },
        ]
      : [
          { to: '/record', label: 'Record', end: true },
          { to: '/riders', label: 'Riders' },
          { to: '/history', label: 'History' },
        ]

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <MotoLogo className="shell-mark" />
          <div className="shell-brand-text">
            <p className="shell-business">{meta.businessName}</p>
            <p className="shell-role">
              {role === 'owner' ? 'Owner' : 'Manager'}
              {loading ? ' · syncing' : ''}
            </p>
          </div>
        </div>

        <nav className="shell-nav" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? 'shell-nav-link active' : 'shell-nav-link'
              }
            >
              <svg
                className="shell-nav-icon"
                viewBox="0 0 24 24"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={ICONS[link.label] ?? ICONS.Dashboard} />
              </svg>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shell-sidebar-foot">
          <div className="shell-user-chip">
            <span className="shell-user-dot" />
            <span>{role === 'owner' ? 'Owner access' : 'Manager access'}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="shell-content">
        <header className="shell-topbar">
          <div className="shell-topbar-brand">
            <MotoLogo className="shell-mark shell-mark-sm" />
            <div>
              <p className="shell-business">{meta.businessName}</p>
              <p className="shell-role">
                {role === 'owner' ? 'Owner view' : 'Manager view'}
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </header>

        <nav className="shell-mobile-nav" aria-label="Mobile">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? 'shell-nav-link active' : 'shell-nav-link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {error ? (
          <div className="shell-banner" role="alert">
            <span>{error}</span>
            <button type="button" className="btn btn-tiny" onClick={clearError}>
              Dismiss
            </button>
          </div>
        ) : null}

        <main className="shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
