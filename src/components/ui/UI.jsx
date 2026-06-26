import './ui.css'

/* ---------- Button ---------- */
export function Button({ variant = 'primary', size = 'md', as, to, children, className = '', ...rest }) {
  const cls = `btn btn-${variant} btn-${size} ${className}`
  if (as === 'a') return <a className={cls} {...rest}>{children}</a>
  return <button className={cls} {...rest}>{children}</button>
}

/* ---------- Card ---------- */
export function Card({ dark, pad = 24, className = '', style, children, ...rest }) {
  return (
    <div className={`card ${dark ? 'card-dark' : ''} ${className}`} style={{ padding: pad, ...style }} {...rest}>
      {children}
    </div>
  )
}

/* ---------- Badge ---------- */
const badgeMap = {
  success: 'badge-success', active: 'badge-success', confirmed: 'badge-success', paid: 'badge-success', published: 'badge-success', included: 'badge-success', sent: 'badge-info',
  warning: 'badge-warning', warm: 'badge-warning', partial: 'badge-warning', pending: 'badge-warning', quoted: 'badge-warning',
  error: 'badge-error', unpaid: 'badge-error', cancelled: 'badge-error', hot: 'badge-error', required: 'badge-error',
  info: 'badge-info', draft: 'badge-neutral', completed: 'badge-info', preview: 'badge-preview', neutral: 'badge-neutral',
}
export function Badge({ children, tone }) {
  const key = (tone || String(children)).toLowerCase().trim()
  const cls = badgeMap[key] || 'badge-neutral'
  return <span className={`badge ${cls}`}>{children}</span>
}

/* ---------- PageHeader ---------- */
export function PageHeader({ title, subtitle, actions, counter }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="t-display-md c-ink">{title}</h1>
        {subtitle && <p className="t-body-sm c-body mt-xs">{subtitle}</p>}
      </div>
      <div className="row gap-sm">
        {counter && <span className="plan-counter mono">{counter}</span>}
        {actions}
      </div>
    </div>
  )
}

/* ---------- Plan limit banner ---------- */
export function PlanBanner() {
  return (
    <div className="plan-banner t-body-sm">
      <span className="pb-icon">▣</span> This action will count against your monthly plan limits <strong>(Free Trial · 20/mo)</strong>
    </div>
  )
}

/* ---------- Filter bar ---------- */
export function FilterBar({ children }) {
  return <div className="filter-bar">{children}</div>
}

/* ---------- Form controls ---------- */
export function Field({ label, hint, required, children, full }) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      {label && <span className="field-label">{label}{required && <em className="req"> *</em>}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
export const Input = (p) => <input className="control" {...p} />
export const Textarea = (p) => <textarea className="control" rows={p.rows || 3} {...p} />
export function Select({ children, ...p }) { return <select className="control" {...p}>{children}</select> }

/* ---------- Data table ---------- */
export function DataTable({ columns, rows, empty = 'No records yet.' }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={{ textAlign: c.align || 'left', width: c.width }}>{c.head}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length}><div className="table-empty t-body-sm c-muted">{empty}</div></td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              {columns.map((c) => <td key={c.key} style={{ textAlign: c.align || 'left' }}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Section banner (wizard) ---------- */
export function SectionBanner({ n, icon, title, sub, tag, tagTone = 'neutral', active, onClick, collapsed }) {
  return (
    <div className={`sec-banner ${active ? 'sec-active' : 'sec-idle'} ${collapsed ? 'sec-collapsed' : ''}`} onClick={onClick}>
      <div className="row gap-sm">
        <span className="sec-icon">{icon}</span>
        <div>
          <div className="sec-title">Section {n}: {title}</div>
          {sub && <div className="sec-sub">{sub}</div>}
        </div>
      </div>
      {tag && <Badge tone={tagTone}>{tag}</Badge>}
    </div>
  )
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon = '☁', title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="t-title-sm c-ink">{title}</div>
      {sub && <div className="t-body-sm c-muted mt-xs">{sub}</div>}
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, width = 480 }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="t-title-md">{title}</span>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Charts (SVG, dependency-free) ---------- */
export function Sparkline({ data = [], color = 'var(--color-ink)', w = 120, h = 36 }) {
  if (!data.length) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const span = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`)
  return (
    <svg width={w} height={h} className="spark">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts.join(' ')} />
    </svg>
  )
}

export function BarChart({ data = [], color = 'var(--color-success)', h = 160 }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="barchart" style={{ height: h }}>
      {data.map((d, i) => (
        <div className="bar-col" key={i}>
          <div className="bar" style={{ height: `${(d.value / max) * 100}%`, background: color }} title={`${d.label}: ${d.value}`} />
          <span className="bar-label t-caption c-muted">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function DonutChart({ segments = [], size = 160, thickness = 22 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((s, i) => {
            const len = (s.value / total) * c
            const dash = `${len} ${c - len}`
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={s.color} strokeWidth={thickness} strokeDasharray={dash} strokeDashoffset={-offset} />
            )
            offset += len
            return el
          })}
        </g>
      </svg>
      <div className="donut-center"><span className="t-title-md">{total}</span></div>
    </div>
  )
}
