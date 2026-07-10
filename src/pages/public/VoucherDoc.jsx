import { useEffect, useRef, useState } from 'react'
import { VoucherCard } from '../../components/ui/VoucherCard'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { usePublic } from '../../hooks/usePublic'
import { preloadAndDownload } from '../../utils/pdf'
import './pdf.css'

export default function VoucherDoc() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const { data } = usePublic(`/voucher/${id}`)
  const v = data?.voucher
  const agency = data?.agency || {}
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

  return (
    <div className="pdf-root">
      <div className="pdf-toolbar no-print">
        <span className="pdf-tb-name">{v.code} · {v.type} voucher</span>
        <button className="pdf-tb-btn" onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download PDF'}</button>
      </div>

      <div className="pdf-page vd-page" ref={docRef}>
        <VoucherCard voucher={v} agency={agency} />

        <div className="vd-terms">
          <strong>Please note:</strong> present this voucher at check-in / boarding. Valid only for the guest named above.
          For any assistance contact {agency.name} — {agency.phone}.
        </div>
        <div className="pdf-powered">Powered by <strong>Wandra</strong></div>
      </div>
    </div>
  )
}
