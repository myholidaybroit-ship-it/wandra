import { AgencyLogo } from './AgencyBrand'
import './voucher-card.css'

/* ------------------------------------------------------------------
   VoucherCard — ONE unified voucher/pass card for every type
   (hotel, transport/cab, activity/ticket, …). Rendered identically in
   the admin list and on the public share page + PDF, so what the agent
   previews is exactly what the traveller receives on WhatsApp / email.
   The agency's own name & logo brand it — never "Wandra".
   ------------------------------------------------------------------ */
const TAG = {
  Pass: { label: 'TRAVEL PASS', color: '#fff', ink: '#111113' },
  Hotel: { label: 'HOTEL', color: '#47c2ff', ink: '#06283d' },
  Transport: { label: 'TRANSPORT', color: '#facc15', ink: '#1a1a1a' },
  Activity: { label: 'ACTIVITY', color: '#5fd68f', ink: '#05301a' },
}

export function VoucherCard({ voucher, agency = {}, actions = null }) {
  if (!voucher) return null
  const tag = TAG[voucher.type] || TAG.Hotel
  const fields = (voucher.fields || []).filter((f) => f && f.v)
  const sections = (voucher.sections || []).filter((s) => s && (s.title || s.fields?.length))
  const contact = [agency.phone, agency.email].filter(Boolean).join('  ·  ')
  return (
    <div className={`vcard ${sections.length ? 'vcard-pass' : ''}`}>
      <div className="vcard-main">
        <div className="vcard-top">
          <span className="vcard-brand">{agency.name || 'Your Agency'}</span>
          <span className="vcard-tag" style={{ background: tag.color, color: tag.ink }}>{tag.label}</span>
        </div>
        <div className="vcard-title">{voucher.title}</div>
        <div className="vcard-fields">
          <div className="vcard-field"><span className="vcard-k">Guest</span><span className="vcard-v">{voucher.clientName || '—'}</span></div>
          {fields.map((f, i) => (
            <div className="vcard-field" key={i}><span className="vcard-k">{f.k}</span><span className="vcard-v">{f.v}</span></div>
          ))}
        </div>
        {sections.length > 0 && (
          <div className="vcard-sections">
            {sections.map((s, i) => {
              const st = TAG[s.tag] || TAG.Hotel
              return (
                <div className="vcard-sec" key={i}>
                  <div className="vcard-sec-head">
                    <span className="vcard-sec-tag" style={{ background: st.color, color: st.ink }}>{st.label}</span>
                    <span className="vcard-sec-title">{s.title}</span>
                  </div>
                  <div className="vcard-fields vcard-sec-fields">
                    {(s.fields || []).filter((f) => f && f.v).map((f, j) => (
                      <div className="vcard-field" key={j}><span className="vcard-k">{f.k}</span><span className="vcard-v">{f.v}</span></div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {voucher.notes && <div className="vcard-notes">{voucher.notes}</div>}
        {(contact || agency.website) && (
          <div className="vcard-foot">
            {contact && <span>{contact}</span>}
            {agency.website && <span>{agency.website}</span>}
          </div>
        )}
      </div>
      <div className="vcard-stub">
        <span className="vcard-logo"><AgencyLogo agency={agency} fallback="mark" /></span>
        {voucher.code && <span className="vcard-code">{voucher.code}</span>}
        {actions && <div className="vcard-acts">{actions}</div>}
      </div>
    </div>
  )
}

export default VoucherCard
