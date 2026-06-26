import { useParams, Link } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button } from '../../../components/ui/UI'
import './vouchers.css'

export default function Vouchers() {
  const { id } = useParams()
  const { packages, agency } = useApp()
  const pkg = packages.find((p) => p.id === id)
  if (!pkg) return <div>Not found.</div>

  return (
    <div>
      <PageHeader title="Vouchers" subtitle={`Hotel & transport vouchers for ${pkg.code}`}
        actions={<Link to={`/app/packages/${id}`}><Button variant="secondary">← Back to Package</Button></Link>} />

      <div className="voucher-grid">
        {pkg.hotelsAlloc?.map((h, i) => (
          <div className="voucher" key={'h' + i}>
            <div className="v-left">
              <div className="row-between"><span className="v-brand">{agency.name}</span><span className="v-tag v-tag-hotel">HOTEL</span></div>
              <div className="v-hotel-name">{h.name}</div>
              <div className="v-meta"><div><span className="v-k">GUEST</span><span className="v-v">{pkg.clientName}</span></div><div><span className="v-k">ROOM</span><span className="v-v">{h.roomType}</span></div><div><span className="v-k">NIGHT</span><span className="v-v">{h.night}</span></div></div>
            </div>
            <div className="v-right">
              <div className="v-pass">HOTEL PASS</div>
              <div className="v-logo">W</div>
              <Button size="sm" variant="secondary" className="v-dl">Download PDF</Button>
            </div>
          </div>
        ))}

        {pkg.cabs?.map((c, i) => (
          <div className="voucher" key={'c' + i}>
            <div className="v-left">
              <div className="row-between"><span className="v-brand">{agency.name}</span><span className="v-tag v-tag-transport">TRANSPORT</span></div>
              <div className="v-route"><span className="v-from">{pkg.fromLocation || 'PKP'}</span><span className="v-arrow">→</span><span className="v-to">{pkg.destination?.split(' ')[0] || 'DST'}</span></div>
              <div className="v-meta"><div><span className="v-k">DRIVER</span><span className="v-v">Local Vendor</span></div><div><span className="v-k">VEHICLE</span><span className="v-v">{c.name} · {c.type}</span></div><div><span className="v-k">TYPE</span><span className="v-v">Private Transfer</span></div></div>
            </div>
            <div className="v-right">
              <div className="v-pass">CAB PASS</div>
              <div className="v-logo">W</div>
              <Button size="sm" variant="secondary" className="v-dl">Download PDF</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
