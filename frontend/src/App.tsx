import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useApp } from './context/AppContext'
import { HistoryPage } from './pages/History'
import { LoginPage } from './pages/Login'
import { OwnerDashboard } from './pages/OwnerDashboard'
import { PayoutsPage } from './pages/Payouts'
import { RecordSalesPage } from './pages/RecordSales'
import { RidersPage } from './pages/Riders'
import { SettingsPage } from './pages/Settings'
import type { Role } from './data/types'
import type { ReactNode } from 'react'

function RequireRole({
  allow,
  children,
}: {
  allow: Role[]
  children: ReactNode
}) {
  const { role, ready } = useApp()
  if (!ready) {
    return (
      <div className="boot-screen">
        <p>Loading Moto Remit…</p>
      </div>
    )
  }
  if (!role) return <Navigate to="/login" replace />
  if (!allow.includes(role)) {
    return <Navigate to={role === 'owner' ? '/' : '/record'} replace />
  }
  return children
}

function HomeRedirect() {
  const { role, ready } = useApp()
  if (!ready) {
    return (
      <div className="boot-screen">
        <p>Loading Moto Remit…</p>
      </div>
    )
  }
  if (!role) return <Navigate to="/login" replace />
  return <Navigate to={role === 'owner' ? '/' : '/record'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireRole allow={['owner', 'manager']}>
            <Layout />
          </RequireRole>
        }
      >
        <Route
          index
          element={
            <RequireRole allow={['owner']}>
              <OwnerDashboard />
            </RequireRole>
          }
        />
        <Route
          path="record"
          element={
            <RequireRole allow={['manager', 'owner']}>
              <RecordSalesPage />
            </RequireRole>
          }
        />
        <Route path="riders" element={<RidersPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route
          path="payouts"
          element={
            <RequireRole allow={['owner']}>
              <PayoutsPage />
            </RequireRole>
          }
        />
        <Route
          path="settings"
          element={
            <RequireRole allow={['owner']}>
              <SettingsPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
