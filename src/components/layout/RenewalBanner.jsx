import { useState } from 'react'
import { useApp } from '../../store/AppContext'

/* ============================================================
   Sticky subscription-renewal prompt shown to the AGENCY.
   The Wandra admin panel triggers a renewal request (sets the
   agency's renewal.status = 'requested' on the backend); it appears
   here and sticks until the agency answers Yes or No. The reply is
   persisted back through the API so the admin panel sees the response.
   ============================================================ */

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
function prettyDate(iso) {
  if (!iso) return ''
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`
}

export default function RenewalBanner() {
  const { agency, plans, respondRenewal } = useApp()
  const [done, setDone] = useState(null) // 'accepted' | 'declined'

  const renewal = agency?.renewal
  const requested = renewal?.status === 'requested'
  const pro = plans?.find((p) => p.id === 'pro') || {}
  const proPrice = Number(pro.price) || 999
  const billedYearly = (pro.billingCycle || 'yearly') === 'yearly'
  const renewalPrice = billedYearly ? (Number(pro.annualTotal) || proPrice * 12) : proPrice

  const respond = async (answer) => {
    setDone(answer)
    try { await respondRenewal(answer) } catch { /* ignore */ }
  }

  if (!requested && !done) return null

  if (done) {
    return (
      <div style={S.wrap}>
        <div style={{ ...S.bar, ...(done === 'accepted' ? S.barOk : S.barNo) }}>
          <span style={S.msg}>
            {done === 'accepted'
              ? '✓ Thanks! Your renewal request has been sent to the Wandra team — they’ll confirm your payment shortly.'
              : 'Noted — we’ve let the Wandra team know you’re not renewing right now.'}
          </span>
          <button style={S.dismiss} onClick={() => setDone(null)}>Dismiss</button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.wrap}>
      <div style={S.bar}>
        <span style={S.dot} />
        <span style={S.msg}>
          Your <strong>Wandra {agency.plan?.name || 'Pro'}</strong> plan renews on <strong>{prettyDate(agency.billing?.renewalOn)}</strong>
          {proPrice ? <> — <strong>{inr(proPrice)}/mo{billedYearly ? `, billed ${inr(renewalPrice)}/yr` : ''}</strong></> : null}. Renew now to keep all your features active.
        </span>
        <button style={{ ...S.btn, ...S.yes }} onClick={() => respond('accepted')}>Yes, renew</button>
        <button style={{ ...S.btn, ...S.no }} onClick={() => respond('declined')}>Not now</button>
      </div>
    </div>
  )
}

const S = {
  wrap: { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1800, display: 'flex', justifyContent: 'center', padding: '0 16px 16px', pointerEvents: 'none' },
  bar: {
    pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    background: 'var(--color-ink, #111113)', color: '#fff',
    borderRadius: 'var(--radius-full, 9999px)', padding: '12px 12px 12px 22px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.25)', maxWidth: 900, width: '100%',
  },
  barOk: { background: 'var(--color-success, #16a34a)' },
  barNo: { background: 'var(--color-charcoal, #2e2e33)' },
  dot: { width: 8, height: 8, borderRadius: 9999, background: '#f8b84f', flex: '0 0 auto' },
  msg: { flex: 1, minWidth: 220, fontSize: 14, fontWeight: 500 },
  btn: { border: 'none', cursor: 'pointer', borderRadius: 9999, padding: '9px 18px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' },
  yes: { background: '#fff', color: 'var(--color-ink, #111113)' },
  no: { background: 'rgba(255,255,255,0.14)', color: '#fff' },
  dismiss: { border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 9999, padding: '8px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' },
}
