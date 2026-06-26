import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../store/AppContext'
import { Button } from '../../components/ui/UI'
import './itinerary.css'

const THEME_ACCENT = { standard: '#171717', classic: '#0d74ce', modern: '#16a34a', premium: '#8145b5', marine: '#0e7490', extensive: '#000000' }

export default function ItineraryPreview() {
  const { code } = useParams()
  const [sp] = useSearchParams()
  const theme = sp.get('theme') || 'classic'
  const { packages, agency } = useApp()
  const pkg = packages.find((p) => p.code === code) || packages[0]
  if (!pkg) return <div className="itin-wrap"><p>Itinerary not found.</p></div>
  const pr = computePricing(pkg)
  const accent = THEME_ACCENT[theme] || '#0d74ce'

  return (
    <div className={`itin itin-${theme}`} style={{ '--accent': accent }}>
      {/* hero */}
      <div className="itin-hero">
        <div className="itin-hero-overlay" />
        <div className="itin-hero-text">
          <div className="t-caption-upper" style={{ color: '#fff', opacity: .9 }}>{agency.name}</div>
          <h1 className="itin-h1">Your Journey to {pkg.destination?.split(' ')[0]}</h1>
          <div className="itin-hero-meta">
            <span>{pkg.days} Days / {pkg.nights} Nights</span>
            <span>•</span><span>{pkg.pax?.adults} Adults</span>
            <span>•</span><span>Private Transfer Included</span>
          </div>
        </div>
      </div>

      <div className="itin-body">
        {/* summary chips */}
        <div className="itin-summary">
          <div className="sum-chip"><span className="sc-k">Travelers</span><span className="sc-v">{pkg.pax?.total} pax</span></div>
          <div className="sum-chip"><span className="sc-k">Stay</span><span className="sc-v">{pkg.nights} nights</span></div>
          <div className="sum-chip"><span className="sc-k">Transport</span><span className="sc-v">Private cab</span></div>
          <div className="sum-chip"><span className="sc-k">Theme</span><span className="sc-v">{theme}</span></div>
        </div>

        {/* daily journey */}
        <div className="t-caption-upper" style={{ color: accent }}>Day by day</div>
        <h2 className="itin-section-title">Your Daily Journey</h2>
        <div className="itin-days">
          {pkg.itinerary?.map((d) => (
            <div className="itin-day" key={d.day}>
              <div className="itin-day-rail"><span className="itin-day-num">Day {d.day}</span></div>
              <div className="itin-day-card">
                <div className="t-title-md">{d.title}</div>
                <div className="t-caption c-muted">{d.mealPlan}</div>
                <p className="t-body-sm c-body mt-xs">{d.description}</p>
                {d.activities && <div className="itin-activities"><strong>Activities:</strong> {d.activities}</div>}
                <div className="itin-stops">
                  {d.stops?.filter((s) => s.destination).map((s, i) => (
                    <div className="itin-stop" key={i}><div className="itin-stop-img" /><div><div className="cell-strong t-body-sm">{s.destination}</div><div className="cell-sub">{s.activity}</div></div></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* inclusions */}
        <div className="grid grid-2 mt-xl">
          <div className="incl-card"><div className="t-title-sm" style={{ color: accent }}>Inclusions</div><ul className="mt-sm">{pkg.inclusions?.map((x) => <li key={x} className="t-body-sm c-body itin-li">✓ {x}</li>)}</ul></div>
          <div className="incl-card"><div className="t-title-sm c-error">Exclusions</div><ul className="mt-sm">{pkg.exclusions?.map((x) => <li key={x} className="t-body-sm c-body itin-li">✕ {x}</li>)}</ul></div>
        </div>

        {/* grand total */}
        <div className="itin-total"><span>Grand Total</span><span>{inr(pr.grandTotal)}</span></div>

        {/* secure booking */}
        <div className="secure-grid">
          <div className="secure-card">
            <div className="t-title-md">🔒 Secure Your Booking</div>
            <div className="bank-grid mt-base">
              <KV k="Account Name" v={agency.bank.accountName} />
              <KV k="Bank Name" v={agency.bank.bankName} />
              <KV k="Account Number" v={agency.bank.accountNumber} />
              <KV k="IFSC Code" v={agency.bank.ifsc} />
            </div>
          </div>
          <div className="qr-card" style={{ background: accent }}>
            <div className="t-body-sm" style={{ color: '#fff', opacity: .9 }}>Ready to book? Call us</div>
            <div className="qr-phone">{agency.phone}</div>
            <div className="qr-box">▦ QR</div>
            <div className="t-caption" style={{ color: '#fff', opacity: .85 }}>Scan to Pay</div>
          </div>
        </div>

        <div className="row gap-sm center mt-xl itin-actions">
          <Link to="/"><Button variant="secondary">← Back</Button></Link>
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
        </div>
      </div>
    </div>
  )
}
function KV({ k, v }) { return <div><div className="sc-k">{k}</div><div className="cell-strong mono">{v}</div></div> }
