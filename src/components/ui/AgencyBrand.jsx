import { useApp } from '../../store/AppContext'

/* ------------------------------------------------------------------
   AgencyLogo — the agency's own brand, everywhere client-facing.
   Renders the logo uploaded in Settings; until one is uploaded it
   falls back to a monogram mark ("mark"), the agency name ("name"),
   or nothing ("none"). Wandra itself only ever appears in the small
   "Powered by Wandra" line, never as the document brand.
   Sizing comes from the className the call-site already uses, so the
   PDF capture rules (explicit width+height + object-fit) still hold.
   ------------------------------------------------------------------ */
export function AgencyLogo({ className = '', style, light = false, fallback = 'mark' }) {
  const { agency } = useApp()
  if (agency.logo) return <img src={agency.logo} alt={agency.name} className={className} style={style} />
  if (fallback === 'none') return null
  if (fallback === 'name') return <span className={`ag-name ${light ? 'light' : ''} ${className}`} style={style}>{agency.name}</span>
  const initials = agency.name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return <span className={`ag-mark ${light ? 'light' : ''} ${className}`} style={style}>{initials}</span>
}
