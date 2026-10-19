import type { ReactNode } from 'react'

interface MetricCardProps {
  eyebrow: string
  value: string
  label: string
  detail?: string
  icon?: ReactNode
  accent?: 'mint' | 'blue' | 'amber' | 'violet' | 'teal' | 'ocean' | 'navy' | 'slate'
}

export function MetricCard({
  eyebrow,
  value,
  label,
  detail,
  icon,
  accent = 'teal',
}: MetricCardProps) {
  // Normalize accent classes
  const normalizedAccent =
    accent === 'mint' ? 'teal' : accent === 'blue' ? 'ocean' : accent === 'violet' ? 'purple' : accent

  return (
    <article className={`gov-metric-card gov-metric-card--${normalizedAccent}`}>
      <div className="gov-metric-card__top">
        <span className="gov-metric-card__eyebrow">{eyebrow}</span>
        {icon && <span className="gov-metric-card__icon" aria-hidden="true">{icon}</span>}
      </div>
      <strong className="gov-metric-card__value">{value}</strong>
      <span className="gov-metric-card__label">{label}</span>
      {detail && <p className="gov-metric-card__detail">{detail}</p>}
    </article>
  )
}
