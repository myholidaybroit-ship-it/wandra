import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../../store/AppContext'
import { Card, Button, Badge, Select } from '../../../components/ui/UI'
import './detail.css'

export default function PackageDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { packages, themes, toggleTheme, createBookingFromPackage, setPackageStatus, addPackageLog, toast } = useApp()
  const pkg = packages.find((p) => p.id === id)
  const [note, setNote] = useState('')
  if (!pkg) return <div className="t-body-md">Package not found. <Link className="c-link" to="/app/packages">Back to Packages</Link></div>
  const pr = computePricing(pkg)
  const outstanding = pr.grandTotal - (pkg.paid || 0)

  const makeBooking = () => { const b = createBookingFromPackage(pkg); toast('Booking created from package!'); nav(`/app/bookings/${b.id}`) }
  const copyLink = (theme) => { navigator.clipboard?.writeText(`${window.location.origin}/i/${pkg.code}?theme=${theme}`); toast(`${theme} preview link copied`) }
  const addNote = () => { if (!note.trim()) return; addPackageLog(pkg.id, note.trim()); setNote(''); toast('Note added') }

  return (
    <div>
      {/* header band */}
      <div className="detail-head">
        <div className="row gap-sm wrap">
          <h1 className="t-display-sm mono">{pkg.code}</h1>
          <Badge tone={pkg.status}>{pkg.status}</Badge>
          <Badge tone="info">Total Pricing</Badge>
        </div>
        <div className="row gap-xs wrap">
          <Link to="/app/packages"><Button variant="secondary" size="sm">← Back</Button></Link>
          <Link to={`/app/packages/${pkg.id}/edit`}><Button variant="secondary" size="sm">✎ Edit</Button></Link>
          <Link to={`/app/packages/${pkg.id}/vouchers`}><Button variant="secondary" size="sm">View Vouchers</Button></Link>
          <Button size="sm" onClick={makeBooking}>+ Create Booking</Button>
        </div>
      </div>

      <div className="detail-grid mt-lg">
        <div className="col gap-lg">
          {/* Overview */}
          <Card>
            <span className="t-title-md">Package Overview</span>
            <hr className="divider" />
            <div className="kv-grid">
              <KV k="Client" v={pkg.clientName} />
              <KV k="From Location" v={pkg.fromLocation || '—'} />
              <KV k="Destination" v={pkg.destination} />
              <KV k="Duration" v={`${pkg.days} Days / ${pkg.nights} Nights`} />
              <KV k="Start Date" v={pkg.startDate || '—'} />
              <KV k="Created By" v={pkg.createdBy} />
            </div>
          </Card>

          {/* Services summary */}
          <Card>
            <span className="t-title-md">Services Summary</span>
            <hr className="divider" />
            <div className="row wrap gap-xs">
              <Badge tone={pkg.flightIncluded ? 'success' : 'error'}>Flight {pkg.flightIncluded ? 'Included' : 'Not Included'}</Badge>
              <Badge tone={pkg.cabs?.length ? 'success' : 'neutral'}>Cab {pkg.cabs?.length ? 'Included' : 'Not Included'}</Badge>
              <Badge tone={pkg.hotelsAlloc?.length ? 'success' : 'neutral'}>Hotel Included ({pkg.nights} Nights)</Badge>
              <Badge tone="info">Itinerary {pkg.days} Days</Badge>
            </div>
            <div className="t-title-sm mt-base mb-sm">Passenger Details</div>
            <div className="kv-grid">
              <KV k="Total Pax" v={pkg.pax?.total} />
              <KV k="Adults" v={pkg.pax?.adults} />
              <KV k="Children" v={pkg.pax?.children} />
              <KV k="Rooms Required" v={pkg.pax?.rooms} />
              <KV k="Room Type" v={pkg.pax?.roomType} />
              <KV k="Extra Beds" v={pkg.pax?.extraBeds} />
            </div>
          </Card>

          {/* Day-wise */}
          <Card>
            <span className="t-title-md">Day-wise Itinerary</span>
            <hr className="divider" />
            {pkg.itinerary?.map((d) => (
              <div className="day-line" key={d.day}>
                <div className="day-badge">Day {d.day}</div>
                <div>
                  <div className="cell-strong">{d.title}</div>
                  <div className="cell-sub">{d.stops?.map((s) => s.destination).filter(Boolean).join(' · ')} — {d.activities}</div>
                </div>
              </div>
            ))}
          </Card>

          {/* Theme previews */}
          <Card>
            <div className="row-between"><span className="t-title-md">Package Previews</span>
              <div className="row gap-xs">
                <Select value={pkg.status} onChange={(e) => { setPackageStatus(pkg.id, e.target.value); toast(`Status: ${e.target.value}`) }} style={{ height: 32, width: 'auto' }}>
                  <option>Draft</option><option>Quoted</option><option>Confirmed</option><option>Cancelled</option><option>Completed</option>
                </Select>
              </div>
            </div>
            <p className="t-body-sm c-body mt-xs mb-base">Send this itinerary to your client in any theme — as a shareable link (no PDF needed) or a printable PDF.</p>
            <div className="theme-list">
              {themes.map((t) => (
                <div className="theme-row" key={t.id}>
                  <div className="row gap-sm"><span className="theme-swatch" style={{ background: t.accent }} /><span className="t-body-sm cell-strong">{t.name}</span></div>
                  <div className="row gap-xs">
                    <Link to={`/i/${pkg.code}?theme=${t.id}`} target="_blank"><Button size="sm" variant="secondary">Preview</Button></Link>
                    <Button size="sm" variant="ghost" onClick={() => copyLink(t.id)}>Copy Link</Button>
                    <label className="row gap-xs t-caption c-body"><input type="checkbox" checked={t.public} onChange={() => toggleTheme(t.id, 'public')} /> Public</label>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes & logs */}
          <Card>
            <span className="t-title-md">Package Notes & Logs</span>
            <hr className="divider" />
            <div className="row gap-xs">
              <input className="control" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
              <Button size="sm" onClick={addNote}>Add</Button>
            </div>
            <div className="mt-base">
              {(pkg.logs || []).length === 0 && <div className="t-body-sm c-muted">No activity yet.</div>}
              {(pkg.logs || []).map((l) => (
                <div className="act-row" key={l.id}><span className="act-dot" /><div className="t-body-sm">{l.text}</div><span className="act-time">{l.at}</span></div>
              ))}
            </div>
          </Card>
        </div>

        {/* Financial summary rail */}
        <div className="col gap-lg">
          <Card className="fin-card">
            <span className="t-title-md">Financial Summary</span>
            <hr className="divider" />
            <div className="fin-line"><span className="c-body">Package Cost</span><span>{inr(pkg.pricing?.packageCost)}</span></div>
            <div className="fin-line"><span className="c-body">Hotel Total</span><span>{inr(pr.hotelTotal)}</span></div>
            <div className="fin-line"><span className="c-body">Cab Total</span><span>{inr(pr.cabTotal)}</span></div>
            <div className="fin-line"><span className="c-body">Other Components</span><span>{inr(pr.otherTotal)}</span></div>
            <div className="fin-line"><span className="c-body">Discount</span><span>− {inr(pr.discount)}</span></div>
            <div className="fin-line"><span className="c-body">GST ({pr.gstPercent}%)</span><span>{inr(pr.gstAmount)}</span></div>
            <hr className="divider" />
            <div className="fin-line total"><span>Grand Total</span><span>{inr(pr.grandTotal)}</span></div>
            <div className="fin-line"><span className="c-success">Paid</span><span className="c-success">{inr(pkg.paid)}</span></div>
            <div className="fin-line"><span className="c-error">Outstanding</span><span className="c-error">{inr(outstanding)}</span></div>
            <Badge tone={outstanding <= 0 ? 'paid' : 'unpaid'}>{outstanding <= 0 ? 'Paid' : 'Unpaid'}</Badge>
            <div className="divider" />
            <div className="row-between"><span className="c-body t-body-sm">Estimated Profit</span><span className="cell-strong c-success">{inr(pr.profit)}</span></div>
          </Card>

          <Card dark>
            <span className="t-title-sm">Make it shareable</span>
            <p className="t-body-sm mt-xs" style={{ color: 'var(--color-on-dark-soft)' }}>Publish a public link your client can open on their phone — itinerary, pricing & bank details to pay.</p>
            <Link to={`/i/${pkg.code}`} target="_blank"><Button className="w-full mt-base">Open Public Preview ↗</Button></Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KV({ k, v }) { return <div className="kv"><span className="kv-k">{k}</span><span className="kv-v">{v}</span></div> }
