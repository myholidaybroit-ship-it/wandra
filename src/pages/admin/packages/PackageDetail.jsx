import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../../store/AppContext'
import { Button, Badge } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './detail.css'

function fmtD(iso, opts = { day: '2-digit', month: 'short' }) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d) ? iso : d.toLocaleDateString('en-IN', opts)
}
function addDays(iso, n) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function PackageDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { packages, clients, hotels, destinations, bookings, createBookingFromPackage, cancelBooking, addPackageLog, toast, canSeePricing } = useApp()
  const pkg = packages.find((p) => p.id === id)
  const [note, setNote] = useState('')

  const model = useMemo(() => {
    if (!pkg) return null
    const sectors = (pkg.sectors || []).filter((s) => s.destination)
    const destShort = sectors.map((s) => s.destination).join(' · ') || (pkg.destination || '').split(' - ')[0]
    const findDest = (name) => {
      if (!name) return null
      const q = name.toLowerCase()
      return destinations.find((x) => x.name.toLowerCase() === q) || destinations.find((x) => q.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(q)) || null
    }
    const cover = findDest(sectors[0]?.destination)?.image || findDest(destShort)?.image || ''
    // group consecutive identical hotel nights into stays
    const stays = []
    ;(pkg.hotelsAlloc || []).forEach((h) => {
      const last = stays[stays.length - 1]
      if (last && last.name === h.name && last.room === h.roomType) { last.nightsCount++; last.to = addDays(pkg.startDate, h.night) }
      else {
        const m = hotels.find((x) => x.id === h.hotelId) || hotels.find((x) => x.name === h.name)
        stays.push({
          name: h.name || '—', room: h.roomType || '', meal: h.mealPlan || '', city: m?.city || '',
          star: Number(m?.rating) || 0, image: m?.image || '', nightsCount: 1,
          from: addDays(pkg.startDate, h.night - 1), to: addDays(pkg.startDate, h.night),
        })
      }
    })
    const optCount = pkg.builderV2?.options?.length || 1
    const activeOptName = optCount > 1 ? (pkg.builderV2.options[pkg.activeOption ?? 0]?.name || '') : ''
    const services = pkg.builderV2?.options?.[pkg.activeOption ?? 0]?.services || []
    const optionStays = (pkg.builderV2?.options || []).map((o, oi) => ({
      name: o.name || `Option ${oi + 1}`,
      stays: (o.stays || []).map((st) => {
        const ns = st.nights?.length ? st.nights : [1]
        const m = hotels.find((x) => x.id === st.hotelId) || hotels.find((x) => x.name === st.hotelName)
        return {
          name: st.hotelName || m?.name || '—', room: st.roomType || '', meal: st.mealPlan || '', city: st.hotelCity || m?.city || '',
          star: Number(st.hotelStar || m?.rating) || 0, image: m?.image || '', nightsCount: ns.length,
          from: addDays(pkg.startDate, Math.min(...ns) - 1), to: addDays(pkg.startDate, Math.max(...ns)),
        }
      }),
    })).filter((o) => o.stays.length)
    const days = (pkg.itinerary || []).map((d) => ({
      n: d.day, title: d.title || `Day ${d.day}`, city: d.stops?.[0]?.destination || '', meal: d.mealPlan || '',
      transfers: services.filter((s) => s.kind === 'transport' && (s.days || []).includes(d.day)),
      acts: services.filter((s) => s.kind === 'activity' && (s.days || []).includes(d.day)),
    }))
    return { sectors, destShort, cover, stays, optionStays, optCount, activeOptName, days }
  }, [pkg, hotels, destinations])

  if (!pkg) return <div className="t-body-md">Package not found. <Link className="c-link" to="/app/packages">Back to Packages</Link></div>

  const client = clients.find((c) => c.id === pkg.clientId)
  const pr = computePricing(pkg)
  const paid = pkg.paid || 0
  const outstanding = Math.max(0, pr.grandTotal - paid)
  const p = pkg.pricing || {}
  const pax = pkg.pax || {}

  const activeBooking = bookings.find((b) => b.packageId === pkg.id && b.status !== 'Cancelled')
  const makeBooking = async () => { try { const b = await createBookingFromPackage(pkg); toast('Booked — invoice generated automatically'); nav(`/app/bookings/${b.id}`) } catch (ex) { toast(ex.message || 'Could not create booking') } }
  const onCancelBooking = async () => { await cancelBooking(activeBooking.id); toast('Booking cancelled — package back to Quoted') }
  const addNote = async () => { if (!note.trim()) return; await addPackageLog(pkg.id, note.trim()); setNote(''); toast('Note added') }

  return (
    <div className="pd">
      {/* ---------- Hero ---------- */}
      <div className="pd-hero" style={model.cover ? { backgroundImage: `linear-gradient(180deg, rgba(10,11,18,.32), rgba(10,11,18,.66)), url("${model.cover}")` } : undefined}>
        <div className="pd-hero-top">
          <Link to="/app/packages" className="pd-back"><Icon name="chevron" size={14} className="pd-back-ic" /> Packages</Link>
          <div className="pd-hero-chips">
            <span className="pd-code">{pkg.code}</span>
            <Badge tone={pkg.status}>{pkg.status}</Badge>
            {model.activeOptName && <span className="pd-opt-chip">{model.activeOptName}</span>}
          </div>
        </div>
        <div className="pd-hero-main">
          <div>
            <h1 className="pd-title">{model.destShort || pkg.destination}</h1>
            <div className="pd-meta">
              {client ? <Link to={`/app/clients/${client.id}`} className="pd-meta-item link">{pkg.clientName}</Link> : <span className="pd-meta-item">{pkg.clientName}</span>}
              <span className="pd-meta-item">{fmtD(pkg.startDate, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span className="pd-meta-item">{pkg.nights}N / {pkg.days}D</span>
              <span className="pd-meta-item">{Number(pax.adults) || 0} Adults{Number(pax.children) ? ` · ${pax.children} Children` : ''}</span>
            </div>
          </div>
          {canSeePricing && (
            <div className="pd-hero-price">
              <span className="pd-price-k">Package price</span>
              <span className="pd-price-v">{inr(pr.grandTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Toolbar ---------- */}
      <div className="pd-toolbar">
        <div className="pd-toolbar-r">
          <Link to={`/app/packages/${pkg.id}/edit`}><Button variant="secondary" size="sm">Edit quote</Button></Link>
          <Link to={`/app/packages/${pkg.id}/vouchers`}><Button variant="secondary" size="sm">Travel Pass</Button></Link>
          <Link to={`/app/packages/${pkg.id}/share`}><Button variant="secondary" size="sm">Share…</Button></Link>
          {activeBooking ? (
            <>
              <Link to={`/app/bookings/${activeBooking.id}`}><Button size="sm"><Icon name="check" size={14} /> Booked · {activeBooking.code}</Button></Link>
              <Button size="sm" variant="danger" onClick={onCancelBooking}>Cancel Booking</Button>
            </>
          ) : (
            <Button size="sm" onClick={makeBooking}>+ Create Booking</Button>
          )}
        </div>
      </div>

      <div className="pd-grid">
        {/* ================= LEFT ================= */}
        <div className="pd-main">
          {/* Stay */}
          {(model.optionStays.length || model.stays.length) > 0 && (
            <section className="pd-card">
              <div className="pd-card-head">
                <span className="pd-card-title">Stay</span>
                <span className="pd-card-sub">{model.optCount > 1 ? `${model.optCount} options` : `${model.stays.length} hotel${model.stays.length > 1 ? 's' : ''}`} · {pkg.nights} nights</span>
              </div>
              <div className="pd-stays">
                {(model.optionStays.length ? model.optionStays : [{ name: model.activeOptName || 'Package', stays: model.stays }]).map((o, oi) => (
                  <div className="pd-stay-option" key={oi}>
                    {model.optCount > 1 && <div className="pd-opt-title">Option {oi + 1}: {o.name}</div>}
                    {o.stays.map((s, i) => (
                      <div className="pd-stay" key={i}>
                        <div className="pd-stay-img" style={s.image ? { backgroundImage: `url("${s.image}")` } : undefined} />
                        <div className="pd-stay-b">
                          <div className="pd-stay-n">{s.name}{s.star ? <span className="pd-stars">{'★'.repeat(s.star)}</span> : null}</div>
                          <div className="pd-stay-m">{[s.city, s.room, s.meal].filter(Boolean).join(' · ')}</div>
                          <div className="pd-stay-d">{fmtD(s.from)} → {fmtD(s.to)} · {s.nightsCount} night{s.nightsCount > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Itinerary timeline */}
          <section className="pd-card">
            <div className="pd-card-head">
              <span className="pd-card-title">Day-wise itinerary</span>
              <span className="pd-card-sub">{pkg.days} days</span>
            </div>
            <div className="pd-timeline">
              {model.days.map((d) => (
                <div className="pd-day" key={d.n}>
                  <div className="pd-day-rail"><span className="pd-day-dot">{d.n}</span></div>
                  <div className="pd-day-b">
                    <div className="pd-day-t">{d.title}{d.city && d.city !== d.title ? <span className="pd-day-city">{d.city}</span> : null}</div>
                    {d.transfers.map((t, i) => (
                      <div className="pd-day-svc" key={`t${i}`}><Icon name="cabs" size={13} /><span>{t.location || 'Transfer'}{t.serviceType ? ` · ${t.serviceType}` : ''}</span></div>
                    ))}
                    {d.acts.map((a, i) => (
                      <div className="pd-day-svc" key={`a${i}`}><Icon name="star" size={13} /><span>{a.location || 'Activity'}{a.serviceType ? ` · ${a.serviceType}` : ''}</span></div>
                    ))}
                    {d.meal && <div className="pd-day-meal">{d.meal}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inclusions / Exclusions — grouped per destination */}
          {(() => {
            const groups = (pkg.inclusionGroups && pkg.inclusionGroups.length)
              ? pkg.inclusionGroups.filter((g) => (g.inclusions?.length || g.exclusions?.length))
              : (((pkg.inclusions || []).length || (pkg.exclusions || []).length)
                  ? [{ destination: '', inclusions: pkg.inclusions || [], exclusions: pkg.exclusions || [] }] : [])
            if (!groups.length) return null
            const multi = groups.length > 1
            return (
              <section className="pd-card">
                <div className="pd-card-head"><span className="pd-card-title">Inclusions &amp; exclusions</span>{multi && <span className="pd-card-sub">per destination</span>}</div>
                {groups.map((g, gi) => (
                  <div className="pd-ie-group" key={gi}>
                    {multi && g.destination && <div className="pd-ie-dest"><Icon name="destinations" size={13} /> {g.destination}</div>}
                    <div className="pd-ie">
                      {g.inclusions.length > 0 && (
                        <div>
                          <div className="pd-ie-h inc">Included</div>
                          {g.inclusions.map((x, i) => <div className="pd-ie-li" key={i}><i className="inc" />{x}</div>)}
                        </div>
                      )}
                      {g.exclusions.length > 0 && (
                        <div>
                          <div className="pd-ie-h exc">Not included</div>
                          {g.exclusions.map((x, i) => <div className="pd-ie-li" key={i}><i className="exc" />{x}</div>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            )
          })()}

          {/* Notes & activity */}
          <section className="pd-card">
            <div className="pd-card-head">
              <span className="pd-card-title">Notes &amp; activity</span>
              {(pkg.logs || []).length > 0 && <span className="pd-card-sub">{pkg.logs.length} note{pkg.logs.length > 1 ? 's' : ''}</span>}
            </div>
            <div className="pd-composer">
              <span className="pd-composer-ic"><Icon name="file" size={15} /></span>
              <input value={note} placeholder="Add a note for your team — follow-ups, calls, changes…"
                onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
              <button className="pd-composer-send" disabled={!note.trim()} onClick={addNote}>Add note</button>
            </div>
            <div className="pd-logs">
              {(pkg.logs || []).length === 0 && (
                <div className="pd-logs-empty">
                  <span className="pd-logs-empty-ic"><Icon name="clock" size={16} /></span>
                  Nothing here yet — notes you add show up as a timeline.
                </div>
              )}
              {(pkg.logs || []).map((l) => (
                <div className="pd-log" key={l.id}>
                  <span className="pd-log-avatar">{(pkg.createdBy || 'W')[0]}</span>
                  <div className="pd-log-b">
                    <span className="pd-log-txt">{l.text}</span>
                    <span className="pd-log-at">{fmtD(l.at, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ================= RIGHT ================= */}
        <aside className="pd-rail">
          {/* Pricing — hidden for roles without pricing access */}
          {canSeePricing && (
          <div className="pd-price-card">
            <div className="pd-pc-head">Pricing</div>
            {p.mode === 'Builder' ? (
              <>
                <div className="pd-pc-row"><span>Cost price</span><span>{inr(p.costPrice)}</span></div>
                <div className="pd-pc-row"><span>Markup{p.markupMode === 'percent' ? ` (${p.markupValue}%)` : ''}</span><span>+{inr(p.markup)}</span></div>
                {p.taxEnabled !== false && <div className="pd-pc-row"><span>Tax ({p.taxPercent || 0}%)</span><span>{inr(p.tax)}</span></div>}
              </>
            ) : (
              <>
                <div className="pd-pc-row"><span>Hotels</span><span>{inr(pr.hotelTotal)}</span></div>
                <div className="pd-pc-row"><span>Transport</span><span>{inr(pr.cabTotal)}</span></div>
                <div className="pd-pc-row"><span>Other</span><span>{inr(pr.otherTotal)}</span></div>
                <div className="pd-pc-row"><span>GST ({pr.gstPercent}%)</span><span>{inr(pr.gstAmount)}</span></div>
              </>
            )}
            <div className="pd-pc-total">
              <span>Selling price</span>
              <strong>{inr(pr.grandTotal)}</strong>
            </div>
            <div className="pd-pc-profit">Profit {inr(pr.profit)}</div>
            <div className="pd-pc-split">
              <div className="pd-pc-pay">
                <span className="k">Paid</span>
                <span className="v ok">{inr(paid)}</span>
              </div>
              <div className="pd-pc-pay">
                <span className="k">Outstanding</span>
                <span className={`v ${outstanding > 0 ? 'due' : 'ok'}`}>{inr(outstanding)}</span>
              </div>
            </div>
            <div className="pd-pc-bar"><span style={{ width: `${pr.grandTotal ? Math.min(100, (paid / pr.grandTotal) * 100) : 0}%` }} /></div>
          </div>
          )}

          {/* Share */}
          <div className="pd-card pd-share">
            <div className="pd-card-head"><span className="pd-card-title">Send to client</span></div>
            <Link to={`/app/packages/${pkg.id}/share`}><Button className="w-full">Share — WhatsApp · Email · PDF</Button></Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
