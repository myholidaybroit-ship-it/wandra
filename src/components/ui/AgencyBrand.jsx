import { useApp } from '../../store/AppContext'

/* ------------------------------------------------------------------
   AgencyLogo — the agency's own brand, everywhere client-facing.
   Renders the logo uploaded in Settings (the single source of truth,
   stored on agency.logo). Standalone public pages (PDF, voucher, etc.)
   pass their fetched brand via the `agency` prop; in-app pages read it
   from context. Until a logo is uploaded it falls back to a monogram
   mark ("mark"), the agency name ("name"), or nothing ("none").
   Wandra itself only ever appears in the small "Powered by Wandra" line.
   ------------------------------------------------------------------ */
export function AgencyLogo({ agency: agencyProp, className = '', style, light = false, fallback = 'mark' }) {
  const ctx = useApp()
  const agency = agencyProp || ctx?.agency || {}
  const name = agency.name || ''
  // the Wandra product logo is never an agency's own brand — treat it as "no logo"
  const logo = agency.logo && !String(agency.logo).includes('wandra-logo') ? agency.logo : ''
  if (logo) return <img src={logo} alt={name} className={className} style={style} />
  if (fallback === 'none') return null
  if (fallback === 'name') return <span className={`ag-name ${light ? 'light' : ''} ${className}`} style={style}>{name}</span>
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return <span className={`ag-mark ${light ? 'light' : ''} ${className}`} style={style}>{initials}</span>
}
