import { useEffect, useRef, useState } from 'react'
import { AgencyLogo } from '../../components/ui/AgencyBrand'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { preloadAndDownload } from '../../utils/pdf'
import './pdf.css'

const TYPE_META = {
  Hotel: { tag: 'HOTEL', pass: 'HOTEL PASS', color: '#47c2ff' },
  Transport: { tag: 'TRANSPORT', pass: 'CAB PASS', color: '#facc15' },
  Activity: { tag: 'ACTIVITY', pass: 'ENTRY PASS', color: '#5fd68f' },
}

export default function VoucherDoc() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const { vouchers, agency } = useApp()
  const v = vouchers.find((x) => x.id === id)
  const docRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const download = async () => {
    if (busy || !docRef.current) return
    setBusy(true)
    try { await preloadAndDownload(docRef.current, `${v.code}-voucher.pdf`) } finally { setBusy(false) }
  }

  useEffect(() => {
    if (!v) return
    document.title = `${v.code} — ${v.title}`
    if (sp.get('download') === '1' || sp.get('print') === '1') { const t = setTimeout(download, 500); return () => clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, sp])

  if (!v) return <div className="pdf-missing">Voucher not found. <Link to="/">Home</Link></div>
  const meta = TYPE_META[v.type] || TYPE_META.Hotel

  return (
    <div className="pdf-root">
      <div className="pdf-toolbar no-print">
        <span className="pdf-tb-name">{v.code} · {v.type} voucher</span>
        <button className="pdf-tb-btn" onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download PDF'}</button>
      </div>

      <div className="pdf-page vd-page" ref={docRef}>
        <div className="vd-ticket">
          <div className="vd-main">
            <div className="vd-top">
              <span className="vd-brand">{agency.name}</span>
              <span className="vd-tag" style={{ background: meta.color }}>{meta.tag}</span>
            </div>
            <div className="vd-title">{v.title}</div>
            <div className="vd-fields">
              <div className="vd-field"><span className="vd-k">Guest</span><span className="vd-v">{v.clientName || '—'}</span></div>
              {(v.fields || []).map((f, i) => (
                <div className="vd-field" key={i}><span className="vd-k">{f.k}</span><span className="vd-v">{f.v || '—'}</span></div>
              ))}
            </div>
            {v.notes && <div className="vd-notes">{v.notes}</div>}
            <div className="vd-foot">
              <span>{[agency.phone, agency.email].filter(Boolean).join(' · ')}</span>
              <span>{agency.website}</span>
            </div>
          </div>
          <div className="vd-stub">
            <span className="vd-pass">{meta.pass}</span>
            <span className="vd-logo"><AgencyLogo /></span>
            <span className="vd-code">{v.code}</span>
          </div>
        </div>

        <div className="vd-terms">
          <strong>Please note:</strong> present this voucher at check-in / boarding. Valid only for the guest named above.
          For any assistance contact {agency.name} — {agency.phone}.
        </div>
        <div className="pdf-powered">Powered by <strong>Wandra</strong></div>
      </div>
    </div>
  )
}
