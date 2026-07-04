import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useApp, inr } from '../../store/AppContext'
import { preloadAndDownload } from '../../utils/pdf'
import './pdf.css'

/* ============================================================
   PDF document — 5 print layouts rendered from a package.
   /pdf/:code?v=classic|vivid|mono|luxe|compact  (&print=1)
   Download = browser print → Save as PDF (A4).
   ============================================================ */

const N = (v) => Number(v) || 0
const ORD = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]) }
function fmtD(iso, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d) ? iso : d.toLocaleDateString('en-IN', opts)
}
function addDays(iso, n) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/* ---------- build one flat model from the package ---------- */
function buildModel(pkg, client, agency, hotels, destinations, activitiesMaster) {
  const opts = pkg.builderV2?.options || []
  const activeIdx = pkg.activeOption ?? 0
  const active = opts[activeIdx] || opts[0]
  const start = pkg.startDate
  const pax = pkg.pax || {}
  const sectors = (pkg.sectors || []).filter((s) => s.destination)
  const destTitle = sectors.map((s) => s.destination).join(' · ') || (pkg.destination || '').split(' - ')[0]

  // image lookups — everything resolves from master data
  const findDest = (name) => {
    if (!name) return null
    const q = name.toLowerCase()
    return destinations.find((x) => x.name.toLowerCase() === q) || destinations.find((x) => q.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(q)) || null
  }
  const destImg = (name) => findDest(name)?.image || ''
  const destGal = (name) => { const d = findDest(name); return d ? [d.image, ...(d.gallery || [])].filter(Boolean) : [] }
  const actImg = (name) => {
    if (!name) return ''
    const q = name.toLowerCase()
    const a = activitiesMaster.find((x) => x.name.toLowerCase() === q) || activitiesMaster.find((x) => q.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(q))
    return a?.image || ''
  }

  const stayRows = (o) => (o?.stays || []).map((st) => {
    const ns = st.nights?.length ? st.nights : [1]
    const h = hotels.find((x) => x.id === st.hotelId) || hotels.find((x) => x.name === st.hotelName)
    return {
      city: st.hotelCity || h?.city || '', name: st.hotelName || '—', star: N(st.hotelStar || h?.rating),
      room: st.roomType || '', meal: st.mealPlan || '', rooms: N(st.rooms) || 1,
      nightsCount: ns.length, checkIn: addDays(start, Math.min(...ns) - 1), checkOut: addDays(start, Math.max(...ns)),
      desc: h?.description || '', image: h?.image || destImg(st.hotelCity),
    }
  })

  // legacy fallback: group hotelsAlloc when no builder options exist
  let options = opts.length
    ? opts.map((o, i) => ({ name: o.name || `Option ${i + 1}`, stays: stayRows(o) }))
    : [{ name: 'Package', stays: groupLegacy(pkg, start, hotels) }]
  options = options.filter((o) => o.stays.length)

  const services = active?.services || []
  const days = (pkg.itinerary || []).map((d) => {
    const transfers = services.filter((s) => s.kind === 'transport' && (s.days || []).includes(d.day))
    const dayActs = services.filter((s) => s.kind === 'activity' && (s.days || []).includes(d.day))
    const city = d.stops?.[0]?.destination || ''
    // collage pool: this day's activity photos, then the city's gallery rotated by day number so consecutive days differ
    const actImgs = dayActs.map((a) => actImg(a.location)).filter(Boolean)
    const pool = destGal(city).length ? destGal(city) : destGal(d.title)
    const rotated = pool.length ? Array.from({ length: pool.length }, (_, i) => pool[(d.day - 1 + i) % pool.length]) : []
    const images = [...new Set([...actImgs, ...rotated])].slice(0, 3)
    return { n: d.day, title: d.title || `Day ${d.day}`, city, desc: d.description || '', meal: d.mealPlan || '', transfers, activities: dayActs, image: images[0] || '', images }
  })

  return {
    code: pkg.code, destTitle, sectors,
    cover: destImg(sectors[0]?.destination) || destImg(destTitle) || stayRows(active || {})[0]?.image || '',
    gallery: [...new Set(sectors.flatMap((s) => destGal(s.destination)))].slice(0, 6),
    nights: pkg.nights, daysCount: pkg.days,
    start, end: addDays(start, pkg.nights || 0),
    client: client?.name || pkg.clientName || 'Guest',
    paxLine: `${N(pax.adults)} Adults${N(pax.children) ? ` · ${N(pax.children)} Children` : ''}${N(pax.infants) ? ` · ${N(pax.infants)} Infants` : ''}`,
    options, flights: active?.flights || [], days,
    inclusions: pkg.inclusions || [], exclusions: pkg.exclusions || [],
    total: N(pkg.pricing?.grandTotal), optionName: opts.length > 1 ? (active?.name || '') : '',
    remarks: pkg.customerRemarks || '', agency,
  }
}
function groupLegacy(pkg, start, hotels) {
  const groups = []
  ;(pkg.hotelsAlloc || []).forEach((h) => {
    const last = groups[groups.length - 1]
    if (last && last.name === h.name && last.room === h.roomType) { last.nightsCount++; last.checkOut = addDays(start, h.night) }
    else {
      const m = hotels.find((x) => x.id === h.hotelId || x.name === h.name)
      groups.push({ city: m?.city || '', name: h.name, star: N(m?.rating), room: h.roomType || '', meal: h.mealPlan || '', rooms: N(h.rooms) || 1, nightsCount: 1, checkIn: addDays(start, h.night - 1), checkOut: addDays(start, h.night), desc: m?.description || '' })
    }
  })
  return groups
}

export default function PdfDoc() {
  const { code } = useParams()
  const [sp] = useSearchParams()
  const { packages, clients, hotels, destinations, activities, agency } = useApp()
  const v = sp.get('v') || 'classic'
  const pkg = packages.find((p) => p.code === code || p.id === code)
  const client = clients.find((c) => c.id === pkg?.clientId)
  const m = useMemo(() => (pkg ? buildModel(pkg, client, agency, hotels, destinations, activities) : null), [pkg, client, agency, hotels, destinations, activities])
  const docRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const download = async () => {
    if (busy || !docRef.current) return
    setBusy(true)
    try { await preloadAndDownload(docRef.current, `${m.code}-${v}.pdf`) } finally { setBusy(false) }
  }

  useEffect(() => {
    if (!m) return
    document.title = `${m.code} — ${m.destTitle} (${v})`
    // auto-download when opened with ?download=1 (or legacy ?print=1)
    if (sp.get('download') === '1' || sp.get('print') === '1') { const t = setTimeout(download, 700); return () => clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, v, sp])

  if (!pkg) return <div className="pdf-missing">Quote not found. <Link to="/">Home</Link></div>

  return (
    <div className="pdf-root">
      <div className="pdf-toolbar no-print">
        <span className="pdf-tb-name">{m.code} · {v}</span>
        <button className="pdf-tb-btn" onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download PDF'}</button>
      </div>
      {/* variant class MUST live on the captured element — html2pdf clones only
          this subtree, so ancestor-scoped CSS would stop matching in the clone */}
      <div ref={docRef} className={`pdf-doc pdf-${v}`}>
        {v === 'classic' && <Classic m={m} />}
        {v === 'vivid' && <Vivid m={m} />}
        {v === 'mono' && <Mono m={m} />}
        {v === 'luxe' && <Luxe m={m} />}
        {v === 'compact' && <Compact m={m} />}
      </div>
    </div>
  )
}

/* ================= shared bits ================= */
const Stars = ({ n }) => n ? <span className="pdf-stars">{'★'.repeat(n)}<span className="pdf-stars-off">{'★'.repeat(Math.max(0, 5 - n))}</span></span> : null
const money = (v) => inr(v)
/* image block — class provides a gradient/colour fallback, url paints on top */
const Img = ({ src, className = '', children, overlay }) => (
  <div className={`pdf-img ${className}`}
    style={src ? { backgroundImage: `${overlay ? `${overlay}, ` : ''}url("${src}")` } : undefined}>
    {children}
  </div>
)

function HotelTable({ m, className = '' }) {
  return m.options.map((o, oi) => (
    <div key={oi} className={`pdf-hotel-block ${className}`}>
      {m.options.length > 1 && <div className="pdf-opt-name">Option {oi + 1}: {o.name}</div>}
      <table className="pdf-table">
        <thead><tr><th>City</th><th>Hotel</th><th>Room</th><th>Meal</th><th>Check-in</th><th>Check-out</th></tr></thead>
        <tbody>
          {o.stays.map((s, i) => (
            <tr key={i}>
              <td>{s.city} {s.nightsCount}N</td>
              <td><strong>{s.name}</strong>{s.star ? ` — ${s.star}★` : ''}</td>
              <td>{s.room}</td><td>{s.meal}</td><td>{fmtD(s.checkIn)}</td><td>{fmtD(s.checkOut)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ))
}

function FlightTable({ m }) {
  if (!m.flights.length) return null
  return (
    <table className="pdf-table">
      <thead><tr><th>Date</th><th>Airline</th><th>Sector</th><th>Departs</th><th>Arrives</th><th>Class</th></tr></thead>
      <tbody>
        {m.flights.map((f, i) => (
          <tr key={i}>
            <td>{fmtD(f.depDate, { day: '2-digit', month: 'short' })}</td>
            <td>{f.airline || '—'} {f.flightNo || ''}</td>
            <td>{(f.fromCode || f.fromCity || '—')} → {(f.toCode || f.toCity || '—')}</td>
            <td>{f.depTime || '—'}</td><td>{f.arrTime || '—'}</td><td>{f.cabinClass || 'Economy'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DaySvc({ d }) {
  return <>
    {d.transfers.map((t, i) => (
      <div className="pdf-svc" key={`t${i}`}>
        <span className="pdf-svc-k">🚗 Transfer</span>
        <div><strong>{t.location || '—'}</strong>{t.serviceType ? ` · ${t.serviceType}` : ''}{t.cabName ? ` · ${t.cabName}` : ''}{t.startTime ? ` · ${t.startTime}` : ''}
          {t.description && <div className="pdf-svc-desc">{t.description}</div>}</div>
      </div>
    ))}
    {d.activities.map((a, i) => (
      <div className="pdf-svc" key={`a${i}`}>
        <span className="pdf-svc-k">🎟 Activity</span>
        <div><strong>{a.location || '—'}</strong>{a.serviceType ? ` · ${a.serviceType}` : ''}
          {a.description && <div className="pdf-svc-desc">{a.description}</div>}</div>
      </div>
    ))}
  </>
}

function Sign({ m, light }) {
  const a = m.agency
  return (
    <div className={`pdf-sign ${light ? 'light' : ''}`}>
      <div className="pdf-sign-t">Thanks &amp; Regards</div>
      <div className="pdf-sign-n">{a.name}</div>
      <div>{[a.phone, a.email].filter(Boolean).join(' · ')}</div>
      {a.website && <div>{a.website}</div>}
    </div>
  )
}

const Powered = ({ light }) => (
  <div className={`pdf-powered ${light ? 'light' : ''}`}>Powered by <strong>Wandra</strong></div>
)

/* ================= V1 · Classic document ================= */
function Classic({ m }) {
  return (
    <div className="pdf-page">
      <header className="cl-head">
        <img src="/brand/wandra-logo.png" alt="" className="cl-logo" />
        <div className="cl-head-mid">
          <h1 className="cl-title">{m.destTitle.toUpperCase()}</h1>
          <div className="cl-meta">Duration: {m.nights} Nights / {m.daysCount} Days</div>
          <div className="cl-meta">Guest: {m.client} · Pax: {m.paxLine}</div>
          <div className="cl-meta">Travel Dates: {fmtD(m.start)} – {fmtD(m.end)} · Ref: {m.code}</div>
        </div>
      </header>
      <div className="cl-dashes" />
      <Img src={m.cover} className="cl-hero">{!m.cover && <span>{m.destTitle}</span>}</Img>

      {m.flights.length > 0 && <>
        <div className="cl-sec">FLIGHTS OFFERED: <em>Rates and seats are subject to availability</em></div>
        <FlightTable m={m} />
      </>}

      <div className="cl-sec">HOTELS OFFERED: <em>Rooms are subject to availability at the time of booking</em></div>
      <HotelTable m={m} />
      {m.total > 0 && <div className="cl-price">TOUR COST @ {money(m.total)} {m.optionName ? `(${m.optionName}) ` : ''}— Total Package</div>}

      {m.inclusions.length > 0 && <>
        <div className="cl-sec red">Inclusion:</div>
        <ul className="cl-list">{m.inclusions.map((x, i) => <li key={i}>➢ {x}</li>)}</ul>
      </>}
      {m.exclusions.length > 0 && <>
        <div className="cl-sec red">Exclusions:</div>
        <ul className="cl-list">{m.exclusions.map((x, i) => <li key={i}>➢ {x}</li>)}</ul>
      </>}

      <div className="cl-sec red">Day wise Itinerary:</div>
      {m.days.map((d) => (
        <div className={`cl-day ${d.image ? 'has-img' : ''}`} key={d.n}>
          <div className="cl-day-b">
            <h2 className="cl-day-h">Day #{d.n} {d.city ? `| ${d.city} ` : ''}| {d.title}</h2>
            {d.desc && <p className="cl-day-p">{d.desc}</p>}
            <DaySvc d={d} />
            {d.meal && <div className="cl-day-meal">Meals: {d.meal}</div>}
          </div>
          {d.image && <Img src={d.image} className="cl-day-img" />}
          {d.images.length > 1 && (
            <div className="cl-collage">{d.images.slice(1).map((u, i) => <Img key={i} src={u} className="cl-collage-img" />)}</div>
          )}
        </div>
      ))}

      {m.remarks && <><div className="cl-sec red">Please Note:</div><p className="cl-day-p">{m.remarks}</p></>}
      <Sign m={m} />
      <Powered />
    </div>
  )
}

/* ================= V2 · Vivid cover ================= */
function Vivid({ m }) {
  return <>
    <div className="pdf-page vv-cover">
      <Img src={m.cover} className="vv-cover-art" overlay="linear-gradient(180deg, rgba(10,12,24,.18), rgba(10,12,24,.42))">
        <div className="vv-cover-box">{m.destTitle}</div>
        <div className="vv-cover-script">Explore {m.sectors[0]?.destination || m.destTitle}<br />with {m.agency.name}</div>
      </Img>
      <div className="vv-band"><span>{m.agency.website}</span><span>✆ {m.agency.phone}</span><span>✉ {m.agency.email}</span></div>
      <div className="vv-logo-wrap"><img src="/brand/wandra-mark.png" alt="" className="vv-logo" /></div>
      <div className="vv-cover-meta">
        <div className="vv-cm"><span>Guest</span><strong>{m.client}</strong></div>
        <div className="vv-cm"><span>Duration</span><strong>{m.nights}N / {m.daysCount}D</strong></div>
        <div className="vv-cm"><span>Dates</span><strong>{fmtD(m.start, { day: '2-digit', month: 'short' })} – {fmtD(m.end, { day: '2-digit', month: 'short' })}</strong></div>
        <div className="vv-cm"><span>Travellers</span><strong>{m.paxLine}</strong></div>
        {m.total > 0 && <div className="vv-cm price"><span>Package price</span><strong>{money(m.total)}</strong></div>}
      </div>
    </div>

    <div className="pdf-page">
      <h2 className="vv-h">Your hotels</h2>
      {m.options.map((o, oi) => (
        <div key={oi}>
          {m.options.length > 1 && <div className="vv-opt">Option {oi + 1}: {o.name}</div>}
          {o.stays.map((s, i) => (
            <div className="vv-hotel" key={i}>
              <div className="vv-hotel-l">
                <div className="vv-chips"><span className="vv-chip">{s.city}</span><span className="vv-chip">{s.nightsCount} Night{s.nightsCount > 1 ? 's' : ''}</span><span className="vv-chip">{s.room}</span>{s.meal && <span className="vv-chip">{s.meal}</span>}</div>
                <div className="vv-hotel-n">{s.name}</div>
                <Stars n={s.star} />
                <div className="vv-hotel-d">{fmtD(s.checkIn)} → {fmtD(s.checkOut)}</div>
                {s.desc && <p className="vv-hotel-p">{s.desc}</p>}
              </div>
              <Img src={s.image} className="vv-hotel-img">{!s.image && <span>{s.city || 'Hotel'}</span>}</Img>
            </div>
          ))}
        </div>
      ))}
      {m.flights.length > 0 && <><h2 className="vv-h">Flights</h2><FlightTable m={m} /></>}
      <div className="vv-cols">
        {m.inclusions.length > 0 && <div><div className="vv-col-h green">Inclusions</div>{m.inclusions.map((x, i) => <div className="vv-li green" key={i}><i />{x}</div>)}</div>}
        {m.exclusions.length > 0 && <div><div className="vv-col-h red">Exclusions</div>{m.exclusions.map((x, i) => <div className="vv-li red" key={i}><i />{x}</div>)}</div>}
      </div>
    </div>

    <div className="pdf-page">
      <h2 className="vv-h">Day-wise itinerary</h2>
      {m.days.map((d) => (
        <div className="vv-day" key={d.n}>
          <span className="vv-day-badge">{ORD(d.n)}<em>Day</em></span>
          <div className="vv-day-b">
            <div className="vv-day-t">{d.title}{d.city ? ` — ${d.city}` : ''}</div>
            {d.desc && <p className="vv-day-p">{d.desc}</p>}
            <DaySvc d={d} />
            {d.images.length > 0 && (
              <div className={`vv-day-imgs n${Math.min(d.images.length, 3)}`}>
                {d.images.slice(0, 3).map((u, i) => <Img key={i} src={u} className="vv-day-img" />)}
              </div>
            )}
          </div>
        </div>
      ))}
      <Sign m={m} />
      <Powered />
    </div>
  </>
}

/* ================= V3 · Wandra minimal mono ================= */
function Mono({ m }) {
  return <>
    <div className="pdf-page mn-cover">
      <img src="/brand/wandra-logo.png" alt="" className="mn-logo" />
      <div className="mn-kicker">Travel Quote · {m.code}</div>
      <h1 className="mn-title">{m.destTitle}</h1>
      <div className="mn-sub">{m.nights} Nights / {m.daysCount} Days — prepared for {m.client}</div>
      {m.cover && <Img src={m.cover} className="mn-cover-img" />}
      <div className="mn-facts">
        <div><span>Dates</span><strong>{fmtD(m.start)} – {fmtD(m.end)}</strong></div>
        <div><span>Travellers</span><strong>{m.paxLine}</strong></div>
        <div><span>Route</span><strong>{m.sectors.map((s) => `${s.destination} ${s.nights}N`).join(' → ') || m.destTitle}</strong></div>
        {m.total > 0 && <div><span>Package price</span><strong>{money(m.total)}</strong></div>}
      </div>
      {m.gallery.length > 1 && (
        <div className="mn-strip">{m.gallery.slice(1, 4).map((u, i) => <Img key={i} src={u} className="mn-strip-img" />)}</div>
      )}
    </div>
    <div className="pdf-page">
      <h2 className="mn-h">01 — Stay</h2>
      <HotelTable m={m} className="mono" />
      {m.flights.length > 0 && <><h2 className="mn-h">02 — Flights</h2><FlightTable m={m} /></>}
      <h2 className="mn-h">{m.flights.length ? '03' : '02'} — Day by day</h2>
      {m.days.map((d) => (
        <div className="mn-day" key={d.n}>
          <span className="mn-day-n">{String(d.n).padStart(2, '0')}</span>
          <div>
            <div className="mn-day-t">{d.title}{d.city ? ` · ${d.city}` : ''}</div>
            {d.desc && <p className="mn-day-p">{d.desc}</p>}
            <DaySvc d={d} />
          </div>
        </div>
      ))}
    </div>
    <div className="pdf-page">
      <div className="vv-cols">
        {m.inclusions.length > 0 && <div><h2 className="mn-h">Included</h2>{m.inclusions.map((x, i) => <div className="mn-li" key={i}>— {x}</div>)}</div>}
        {m.exclusions.length > 0 && <div><h2 className="mn-h">Not included</h2>{m.exclusions.map((x, i) => <div className="mn-li" key={i}>— {x}</div>)}</div>}
      </div>
      {m.remarks && <><h2 className="mn-h">Notes</h2><p className="mn-day-p">{m.remarks}</p></>}
      {m.total > 0 && <div className="mn-price"><span>Total package price</span><strong>{money(m.total)}</strong></div>}
      <Sign m={m} />
      <Powered />
    </div>
  </>
}

/* ================= V4 · Luxe dark ================= */
function Luxe({ m }) {
  return <>
    <div className="pdf-page lx-cover">
      {m.cover && <Img src={m.cover} className="lx-cover-bg" />}
      <div className="lx-frame">
        <img src="/brand/wandra-logo.png" alt="" className="lx-logo" />
        <div className="lx-kicker">A bespoke journey for</div>
        <div className="lx-client">{m.client}</div>
        <h1 className="lx-title">{m.destTitle}</h1>
        <div className="lx-rule" />
        <div className="lx-meta">{m.nights} Nights · {m.daysCount} Days · {fmtD(m.start, { day: '2-digit', month: 'short' })} – {fmtD(m.end, { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div className="lx-meta soft">{m.paxLine} · Ref {m.code}</div>
        {m.total > 0 && <div className="lx-price">{money(m.total)}</div>}
      </div>
    </div>
    <div className="pdf-page lx-body">
      {(m.gallery[1] || m.cover) && <Img src={m.gallery[1] || m.cover} className="lx-band" />}
      <h2 className="lx-h">Residences</h2>
      {m.options.map((o, oi) => (
        <div key={oi}>
          {m.options.length > 1 && <div className="lx-opt">Option {oi + 1} — {o.name}</div>}
          {o.stays.map((s, i) => (
            <div className="lx-hotel" key={i}>
              <div className="lx-hotel-n">{s.name} <Stars n={s.star} /></div>
              <div className="lx-hotel-m">{[s.city, s.room, s.meal, `${s.nightsCount}N`].filter(Boolean).join(' · ')} — {fmtD(s.checkIn, { day: '2-digit', month: 'short' })} to {fmtD(s.checkOut, { day: '2-digit', month: 'short' })}</div>
            </div>
          ))}
        </div>
      ))}
      {m.flights.length > 0 && <><h2 className="lx-h">Flights</h2>
        {m.flights.map((f, i) => (
          <div className="lx-hotel" key={i}>
            <div className="lx-hotel-n">{f.fromCity || f.fromCode || '—'} — {f.toCity || f.toCode || '—'}</div>
            <div className="lx-hotel-m">{[f.airline, f.flightNo, f.cabinClass || 'Economy', f.depTime && `dep ${f.depTime}`].filter(Boolean).join(' · ')}</div>
          </div>
        ))}</>}
      <h2 className="lx-h">The journey</h2>
      {m.days.map((d) => (
        <div className="lx-day" key={d.n}>
          <div className="lx-day-n">Day {String(d.n).padStart(2, '0')}</div>
          <div className="lx-day-b">
            <div className="lx-day-t">{d.title}{d.city ? ` — ${d.city}` : ''}</div>
            {d.desc && <p className="lx-day-p">{d.desc}</p>}
          </div>
        </div>
      ))}
      <div className="vv-cols lx-cols">
        {m.inclusions.length > 0 && <div><h2 className="lx-h">Included</h2>{m.inclusions.map((x, i) => <div className="lx-li" key={i}>◆ {x}</div>)}</div>}
        {m.exclusions.length > 0 && <div><h2 className="lx-h">Not included</h2>{m.exclusions.map((x, i) => <div className="lx-li off" key={i}>◇ {x}</div>)}</div>}
      </div>
      <Sign m={m} light />
      <Powered light />
    </div>
  </>
}

/* ================= V5 · Compact one-pager ================= */
function Compact({ m }) {
  return (
    <div className="pdf-page cp-page">
      <header className="cp-head">
        <img src="/brand/wandra-logo.png" alt="" className="cp-logo" />
        <div className="cp-head-m">
          <div className="cp-title">{m.destTitle} — {m.nights}N/{m.daysCount}D</div>
          <div className="cp-sub">{m.client} · {m.paxLine} · {fmtD(m.start, { day: '2-digit', month: 'short' })}–{fmtD(m.end, { day: '2-digit', month: 'short', year: 'numeric' })} · {m.code}</div>
        </div>
        {m.total > 0 && <div className="cp-price"><span>Total</span><strong>{money(m.total)}</strong></div>}
      </header>
      <div className="cp-grid">
        <div>
          <div className="cp-sec">Hotels</div>
          {m.options.map((o, oi) => (
            <div key={oi}>
              {m.options.length > 1 && <div className="cp-opt">Option {oi + 1}: {o.name}</div>}
              {o.stays.map((s, i) => (
                <div className="cp-row" key={i}><strong>{s.city} {s.nightsCount}N</strong> — {s.name}{s.star ? ` ${s.star}★` : ''} · {s.room} · {s.meal}</div>
              ))}
            </div>
          ))}
          {m.flights.length > 0 && <>
            <div className="cp-sec">Flights</div>
            {m.flights.map((f, i) => <div className="cp-row" key={i}><strong>{f.fromCode || f.fromCity} → {f.toCode || f.toCity}</strong> — {f.airline} {f.flightNo} · {f.depTime || ''}{f.cabinClass ? ` · ${f.cabinClass}` : ''}</div>)}
          </>}
          <div className="cp-sec">Day plan</div>
          {m.days.map((d) => (
            <div className="cp-row" key={d.n}><strong>D{d.n}</strong> — {d.title}{d.city ? ` (${d.city})` : ''}{d.activities.length ? ` · ${d.activities.map((a) => a.location).filter(Boolean).join(', ')}` : ''}</div>
          ))}
        </div>
        <div>
          {m.inclusions.length > 0 && <><div className="cp-sec green">Included</div>{m.inclusions.map((x, i) => <div className="cp-row" key={i}>✓ {x}</div>)}</>}
          {m.exclusions.length > 0 && <><div className="cp-sec red">Not included</div>{m.exclusions.map((x, i) => <div className="cp-row" key={i}>✕ {x}</div>)}</>}
          {m.remarks && <><div className="cp-sec">Notes</div><div className="cp-row">{m.remarks}</div></>}
          <div className="cp-contact">
            <strong>{m.agency.name}</strong>
            <div>{[m.agency.phone, m.agency.email].filter(Boolean).join(' · ')}</div>
            <div>{m.agency.website}</div>
          </div>
        </div>
      </div>
      <Powered />
    </div>
  )
}
