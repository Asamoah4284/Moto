import type { ReactNode } from 'react'
import './KpiCard.css'

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
  featured?: boolean
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'neutral',
  featured = false,
}: KpiCardProps) {
  return (
    <article
      className={`kpi kpi-${tone}${featured ? ' kpi-featured' : ''}`}
    >
      <div className="kpi-top">
        <p className="kpi-label">{label}</p>
        <span className="kpi-orb" aria-hidden />
      </div>
      <p className="kpi-value">{value}</p>
      {hint ? <p className="kpi-hint">{hint}</p> : null}
    </article>
  )
}

export function EmptyState({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {children ? <div className="empty-body">{children}</div> : null}
    </div>
  )
}
