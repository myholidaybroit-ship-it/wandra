import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { inr } from '../../store/AppContext'
import { usePublic } from '../../hooks/usePublic'
import { preloadAndDownload } from '../../utils/pdf'
import { AgencyLogo } from '../../components/ui/AgencyBrand'
import { normalizeCfg, themeVars, patternBg, rgba } from '../../utils/pdfTheme'
import PdfStudio from './PdfStudio'
import './pdf.css'

/* ============================================================
   PDF document — print layouts rendered from a package.
   /pdf/:code?v=classic|vivid|mono|luxe|holiday|coastal  (&download=1)

   Free layouts (classic/vivid/mono/luxe) are fixed designs.
   Premium layouts (holiday/coastal) open the PDF Studio: a live
   customiser for colour, pattern, frame, fonts, element toggles
   and drag-to-reorder sections. Download = real .pdf (A4).
   ============================================================ */

export const PREMIUM_VARIANTS = ['holiday', 'coastal']
export const isPremiumVariant = (v) => PREMIUM_VARIANTS.includes(v)

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
/* per-destination inclusion / exclusion groups (falls back to the flat lists) */
function ieGroupsOf(pkg) {
  const raw = (pkg.inclusionGroups && pkg.inclusionGroups.length)
    ? pkg.inclusionGroups
    : [{ destination: '', inclusions: pkg.inclusions || [], exclusions: pkg.exclusions || [] }]
  return raw.filter((g) => (g.inclusions?.length || g.exclusions?.length))
}

/* Selling total for one builder option — mirrors the builder's Markup → Tax →
   Rounding engine so each option's PDF shows its own price, not the active one. */
function optionGrandTotal(opt, s = {}) {
  if (!opt) return 0
  const nn = (v) => Number(v) || 0
  const bed = (st) => nn(st.aweb) * nn(st.awebRate) + nn(st.cweb) * nn(st.cwebRate) + nn(st.cnb) * nn(st.cnbRate)
  const hotelCost = (opt.stays || []).reduce((a, st) => a + (nn(st.rate) * nn(st.rooms) + bed(st)) * ((st.nights || []).length), 0)
  const svcCost = (kind) => (opt.services || []).filter((x) => x.kind === kind).reduce((a, x) => a + nn(x.rate) * (nn(x.qty) || 1) * Math.max(1, (x.days || []).length), 0)
  const flightCost = (opt.flights || []).reduce((a, f) => a + nn(f.cost), 0)
  const extraCost = (opt.extras || []).reduce((a, e) => a + nn(e.cost), 0)
  const costPrice = hotelCost + svcCost('transport') + svcCost('activity') + flightCost + extraCost
  const markup = s.markupMode === 'flat' ? nn(s.markupValue) : costPrice * nn(s.markupValue) / 100
  const taxBase = s.taxOn === 'cost_markup' ? costPrice + markup : costPrice
  const tax = s.taxEnabled ? Math.round(taxBase * nn(s.taxPercent) / 100 * 100) / 100 : 0
  const preRound = costPrice + markup + tax
  const roundTo = nn(s.roundTo)
  return roundTo ? Math.round(preRound / roundTo) * roundTo : Math.round(preRound)
}

/* ---------- build one flat model from the package ---------- */
function buildModel(pkg, client, agency, hotels, destinations, activitiesMaster, serviceLocationsMaster = [], cabsMaster = [], optionIdx = null) {
  const opts = pkg.builderV2?.options || []
  const defaultIdx = pkg.activeOption ?? 0
  const activeIdx = optionIdx != null && opts[optionIdx] ? optionIdx : defaultIdx
  const active = opts[activeIdx] || opts[0]
  // the stored pkg.pricing belongs to the default option; any other option is priced live
  const grandTotal = activeIdx === defaultIdx
    ? (N(pkg.pricing?.grandTotal) || optionGrandTotal(active, pkg.builderV2))
    : (optionGrandTotal(active, pkg.builderV2) || N(pkg.pricing?.grandTotal))
  const start = pkg.startDate
  const pax = pkg.pax || {}
  const sectors = (pkg.sectors || []).filter((s) => s.destination)
  const destTitle = sectors.map((s) => s.destination).join(' · ') || (pkg.destination || '').split(' - ')[0]

  // image lookups — everything resolves from master data
  const norm = (v) => String(v || '').trim().toLowerCase()
  const loose = (needle, hay) => {
    const a = norm(needle), b = norm(hay)
    return a && b && (a === b || a.includes(b) || b.includes(a))
  }
  const findDest = (name) => {
    if (!name) return null
    return destinations.find((x) => norm(x.name) === norm(name)) || destinations.find((x) => loose(name, x.name) || loose(name, x.location)) || null
  }
  const destImg = (name) => findDest(name)?.image || ''
  const destGal = (name) => { const d = findDest(name); return d ? [d.image, ...(d.gallery || [])].filter(Boolean) : [] }
  const actImg = (name) => {
    if (!name) return ''
    const a = activitiesMaster.find((x) => norm(x.name) === norm(name)) || activitiesMaster.find((x) => loose(name, x.name) || loose(name, x.category))
    return a?.image || ''
  }
  const cabImg = (name, id, type) => {
    if (!name && !id) return ''
    const c = cabsMaster.find((x) => x.id === id) || cabsMaster.find((x) => norm(x.name) === norm(name)) || cabsMaster.find((x) => loose(name, x.name) || loose(name, x.type) || loose(type, x.name) || loose(type, x.type))
    return c?.image || ''
  }
  // transport routes resolve their photo + notes from the Service Locations master (by route name)
  const svcMaster = (name) => {
    if (!name) return null
    return serviceLocationsMaster.find((x) => norm(x.name) === norm(name)) || serviceLocationsMaster.find((x) => loose(name, x.name) || loose(name, x.serviceType)) || null
  }

  const stayRows = (o) => (o?.stays || []).map((st) => {
    const ns = st.nights?.length ? st.nights : [1]
    const h = hotels.find((x) => x.id === st.hotelId) || hotels.find((x) => x.name === st.hotelName)
    return {
      city: st.hotelCity || h?.city || '', name: st.hotelName || '—', star: N(st.hotelStar || h?.rating),
      room: st.roomType || '', meal: st.mealPlan || '', rooms: N(st.rooms) || 1,
      nightsCount: ns.length, checkIn: addDays(start, Math.min(...ns) - 1), checkOut: addDays(start, Math.max(...ns)),
      desc: st.hotelDescription || h?.description || '', image: st.hotelImage || h?.image || destImg(st.hotelCity),
      // the hotel's own uploaded photos drive the accommodation collage; city gallery fills any gaps
      gallery: [...new Set([st.hotelImage, h?.image, ...(h?.gallery || []), ...destGal(st.hotelCity)].filter(Boolean))],
    }
  })

  // each PDF is one option's quotation — show only the selected option's hotels
  // (legacy packages with no builder option fall back to grouping hotelsAlloc)
  let options = active
    ? [{ name: active.name || `Option ${activeIdx + 1}`, stays: stayRows(active) }]
    : [{ name: 'Package', stays: groupLegacy(pkg, start, hotels) }]
  options = options.filter((o) => o.stays.length)

  const services = active?.services || []
  const days = (pkg.itinerary || []).map((d) => {
    // Resolve this day's services from the builder option first (it carries the
    // days, rates & picked photos); fall back to the package's own stored
    // per-day itinerary services so legacy / template-built packages still show
    // their transfers & activities (name → location, plus master-data photos).
    const stored = (d.services || []).map((s) => ({ ...s, location: s.location || s.name || '', kind: s.kind || 'transport' }))
    const fromOpt = services.filter((s) => (s.days || []).includes(d.day))
    const dayServices = fromOpt.length ? fromOpt : stored
    // transfers carry their own resolved photo + description (own value, else the route master's)
    const transfers = dayServices.filter((s) => s.kind === 'transport')
      .map((t) => { const sm = svcMaster(t.location); return { ...t, image: t.image || sm?.image || cabImg(t.cabName || t.location, t.cabId, t.serviceType) || '', description: t.description || sm?.description || '' } })
    const dayActs = dayServices.filter((s) => s.kind === 'activity')
    const city = d.stops?.[0]?.destination || ''
    // collage pool: this day's activity + service photos, then the city's gallery rotated by day number so consecutive days differ
    const actImgs = dayActs.map((a) => a.image || actImg(a.location)).filter(Boolean)
    const svcImgs = transfers.map((t) => t.image).filter(Boolean)
    const pool = destGal(city).length ? destGal(city) : destGal(d.title)
    const rotated = pool.length ? Array.from({ length: pool.length }, (_, i) => pool[(d.day - 1 + i) % pool.length]) : []
    const images = [...new Set([...actImgs, ...svcImgs, ...rotated])].slice(0, 3)
    // each activity carries its own resolved photo (fallbacks handled at render)
    const acts = dayActs.map((a, ai) => ({ ...a, image: a.image || actImg(a.location || a.serviceType) || images[ai % Math.max(1, images.length)] || '' }))
    return { n: d.day, title: d.title || `Day ${d.day}`, city, desc: d.description || '', meal: d.mealPlan || '', transfers, activities: acts, image: images[0] || '', images }
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
    ieGroups: ieGroupsOf(pkg), ieMulti: ieGroupsOf(pkg).length > 1,
    total: grandTotal, optionName: opts.length > 1 ? (active?.name || `Option ${activeIdx + 1}`) : '',
    adults: N(pax.adults), children: N(pax.children),
    perPax: (N(pax.adults) + N(pax.children)) ? Math.round(grandTotal / (N(pax.adults) + N(pax.children))) : grandTotal,
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
      groups.push({ city: h.city || m?.city || '', name: h.name, star: N(h.star || m?.rating), room: h.roomType || '', meal: h.mealPlan || '', rooms: N(h.rooms) || 1, nightsCount: 1, checkIn: addDays(start, h.night - 1), checkOut: addDays(start, h.night), desc: h.description || m?.description || '', image: h.image || m?.image || '', gallery: [...new Set([h.image, m?.image, ...(m?.gallery || [])].filter(Boolean))] })
    }
  })
  return groups
}

export default function PdfDoc() {
  const { code } = useParams()
  const [sp] = useSearchParams()
  const { data, loading } = usePublic(`/itinerary/${code}`)
  const pkg = data?.package
  const agency = data?.agency || {}
  const client = { name: pkg?.clientName }
  // master data isn't loaded on the public doc — the package payload is
  // denormalised (hotelsAlloc/itinerary carry names & prices), so enrichment
  // (hotel/destination photos) degrades gracefully to the stored values.
  const masters = data?.masters || {}
  const hotels = masters.hotels || []
  const destinations = masters.destinations || []
  const activities = masters.activities || []
  const serviceLocations = masters.serviceLocations || []
  const cabs = masters.cabs || []
  const v = sp.get('v') || 'classic'
  const premium = isPremiumVariant(v)
  const optionParam = sp.get('option') != null ? Number(sp.get('option')) : null
  const m = useMemo(() => (pkg ? buildModel(pkg, client, agency, hotels, destinations, activities, serviceLocations, cabs, optionParam) : null), [pkg, agency, data, optionParam]) // eslint-disable-line react-hooks/exhaustive-deps
  const docRef = useRef(null)
  const [busy, setBusy] = useState(false)

  // studio is available on premium variants unless explicitly opened read-only (?studio=0)
  const studioOn = premium && sp.get('studio') !== '0'
  const [studioOpen, setStudioOpen] = useState(studioOn)

  // customisation config: normalise the package's saved config over theme defaults
  const [cfg, setCfg] = useState(() => normalizeCfg(v, pkg?.pdfCustom?.[v]))
  useEffect(() => { setCfg(normalizeCfg(v, pkg?.pdfCustom?.[v])) }, [v, pkg?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // apply customisation live (local to this public document view)
  const applyCfg = useCallback((next) => { setCfg(next) }, [])
  const resetCfg = useCallback(() => applyCfg(normalizeCfg(v, null)), [applyCfg, v])

  const download = async () => {
    if (busy || !docRef.current) return
    setBusy(true)
    try { await preloadAndDownload(docRef.current, `${m.code}-${v}.pdf`) } finally { setBusy(false) }
  }

  useEffect(() => {
    if (!m) return
    document.title = `${m.code} — ${m.destTitle} (${v})`
    if (sp.get('download') === '1' || sp.get('print') === '1') { const t = setTimeout(download, 700); return () => clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, v, sp])

  if (loading) return <div className="pdf-missing">Loading…</div>
  if (!pkg) return <div className="pdf-missing">Quote not found. <Link to="/">Home</Link></div>

  // resolved theme → CSS variables + pattern applied inline on the captured root
  const vars = premium ? themeVars(cfg) : null
  const pat = premium && cfg.showPattern ? patternBg(cfg.pattern, cfg.accent, 0.16 * (cfg.patternStrength ?? 0.5) + 0.02) : null
  const rootStyle = premium ? {
    ...vars,
    fontFamily: 'var(--pdf-font)',
    color: 'var(--pdf-ink)',
    '--pdf-pattern': pat ? pat.image : 'none',
    '--pdf-pattern-size': pat ? pat.size : 'auto',
  } : undefined

  return (
    <div className={`pdf-root ${studioOpen ? 'has-studio' : ''}`}>
      <div className="pdf-toolbar no-print">
        <span className="pdf-tb-name">{m.code} · <strong>{v}</strong>{premium && <span className="pdf-tb-pro">PRO</span>}</span>
        <div className="pdf-tb-actions">
          {premium && (
            <button className="pdf-tb-ghost" onClick={() => setStudioOpen((o) => !o)}>
              {studioOpen ? 'Hide studio' : '✦ Customize'}
            </button>
          )}
          <button className="pdf-tb-btn" onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download PDF'}</button>
        </div>
      </div>

      <div className="pdf-stage">
        {/* variant class MUST live on the captured element — html2pdf clones only
            this subtree, so ancestor-scoped CSS would stop matching in the clone */}
        <div className="pdf-scroll">
          <div ref={docRef} className={`pdf-doc pdf-${v} ${premium ? `frame-${cfg.frame} cover-${cfg.coverStyle}` : ''}`}
            style={rootStyle} data-pdf-flow={premium ? '1' : undefined}>
            {v === 'holiday' && <Holiday m={m} cfg={cfg} />}
            {v === 'coastal' && <Coastal m={m} cfg={cfg} />}
            {v === 'classic' && <Classic m={m} />}
            {v === 'vivid' && <Vivid m={m} />}
            {v === 'mono' && <Mono m={m} />}
            {v === 'luxe' && <Luxe m={m} />}
          </div>
        </div>
        {studioOpen && (
          <PdfStudio variant={v} cfg={cfg} onChange={applyCfg} onReset={resetCfg}
            onClose={() => setStudioOpen(false)} onDownload={download} busy={busy} />
        )}
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
  const tickets = m.flights.filter((f) => f.ticketImg)
  return (
    <>
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
      {tickets.length > 0 && (
        <div className="pdf-tickets">
          {tickets.map((f, i) => (
            <figure className="pdf-ticket" key={i}>
              <img className="pdf-ticket-img" src={f.ticketImg} alt="Flight ticket" />
              <figcaption>{(f.fromCode || f.fromCity || 'Flight')} → {(f.toCode || f.toCity || '')} · fare / ticket</figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  )
}

function DaySvc({ d }) {
  return <>
    {d.transfers.map((t, i) => (
      <div className="pdf-svc" key={`t${i}`}>
        <span className="pdf-svc-k">Transfer</span>
        {t.image && <Img src={t.image} className="pdf-svc-img" />}
        <div><strong>{t.location || '—'}</strong>{t.serviceType ? ` · ${t.serviceType}` : ''}{t.cabName ? ` · ${t.cabName}` : ''}
          {t.description && <div className="pdf-svc-desc">{t.description}</div>}</div>
      </div>
    ))}
    {d.activities.map((a, i) => (
      <div className="pdf-svc" key={`a${i}`}>
        <span className="pdf-svc-k">Activity</span>
        {a.image && <Img src={a.image} className="pdf-svc-img" />}
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
      <AgencyLogo agency={m.agency} className="pdf-sign-logo" fallback="name" />
      <div>{[a.phone, a.email].filter(Boolean).join(' · ')}</div>
      {a.website && <div>{a.website}</div>}
    </div>
  )
}

const Powered = ({ light }) => (
  <div className={`pdf-powered ${light ? 'light' : ''}`}>Powered by <strong>Wandra</strong></div>
)

/* ================= premium studio decoration =================
   Layered behind the content of a premium sheet: a recoloured travel
   pattern, an oversized watermark monogram and a decorative frame. All
   are pure CSS/inline-styled so html2canvas paints them into the PDF. */
function Deco({ cfg, m }) {
  const initials = (m.agency?.name || 'W').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <>
      {cfg.showPattern && cfg.pattern !== 'none' && <div className="pdf-pat" aria-hidden />}
      {cfg.showWatermark && <div className="pdf-wm" aria-hidden>{initials}</div>}
      {cfg.frame !== 'none' && <div className={`pdf-frame frame-${cfg.frame}`} aria-hidden>
        {cfg.frame === 'corners' && <><i className="fc tl" /><i className="fc tr" /><i className="fc bl" /><i className="fc br" /></>}
      </div>}
    </>
  )
}

/* premium section heading with a small travel glyph + accent rule */
const GLYPH = {
  schedule: '', itinerary: '', hotels: '', flights: '', inclusions: '✓', services: '',
  info: '', quote: '', notes: '✷',
}
function SecH({ id, children, sub }) {
  return (
    <div className="pdf-sech pdf-avoid">
      <span className="pdf-sech-g" aria-hidden>{GLYPH[id] || '✦'}</span>
      <div className="pdf-sech-t">{children}{sub && <em>{sub}</em>}</div>
      <span className="pdf-sech-rule" aria-hidden />
    </div>
  )
}

/* ================= V1 · Classic document ================= */
function Classic({ m }) {
  return (
    <div className="pdf-page">
      <header className="cl-head">
        <AgencyLogo agency={m.agency} className="cl-logo" />
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

      {m.ieGroups.map((g, gi) => (
        <div key={gi}>
          {g.inclusions.length > 0 && <>
            <div className="cl-sec red">Inclusion{m.ieMulti && g.destination ? ` — ${g.destination}` : ':'}</div>
            <ul className="cl-list">{g.inclusions.map((x, i) => <li key={i}>➢ {x}</li>)}</ul>
          </>}
          {g.exclusions.length > 0 && <>
            <div className="cl-sec red">Exclusions{m.ieMulti && g.destination ? ` — ${g.destination}` : ':'}</div>
            <ul className="cl-list">{g.exclusions.map((x, i) => <li key={i}>➢ {x}</li>)}</ul>
          </>}
        </div>
      ))}

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
      <div className="vv-band"><span>{m.agency.website}</span><span>{m.agency.phone}</span><span>{m.agency.email}</span></div>
      <div className="vv-logo-wrap"><AgencyLogo agency={m.agency} className="vv-logo" /></div>
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
        <div>{m.ieGroups.map((g, gi) => g.inclusions.length > 0 && (
          <div key={gi}><div className="vv-col-h green">Inclusions{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</div>{g.inclusions.map((x, i) => <div className="vv-li green" key={i}><i />{x}</div>)}</div>
        ))}</div>
        <div>{m.ieGroups.map((g, gi) => g.exclusions.length > 0 && (
          <div key={gi}><div className="vv-col-h red">Exclusions{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</div>{g.exclusions.map((x, i) => <div className="vv-li red" key={i}><i />{x}</div>)}</div>
        ))}</div>
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
      <AgencyLogo agency={m.agency} className="mn-logo" />
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
        <div>{m.ieGroups.map((g, gi) => g.inclusions.length > 0 && (
          <div key={gi}><h2 className="mn-h">Included{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</h2>{g.inclusions.map((x, i) => <div className="mn-li" key={i}>— {x}</div>)}</div>
        ))}</div>
        <div>{m.ieGroups.map((g, gi) => g.exclusions.length > 0 && (
          <div key={gi}><h2 className="mn-h">Not included{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</h2>{g.exclusions.map((x, i) => <div className="mn-li" key={i}>— {x}</div>)}</div>
        ))}</div>
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
        <AgencyLogo agency={m.agency} className="lx-logo" light />
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
        <div>{m.ieGroups.map((g, gi) => g.inclusions.length > 0 && (
          <div key={gi}><h2 className="lx-h">Included{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</h2>{g.inclusions.map((x, i) => <div className="lx-li" key={i}>◆ {x}</div>)}</div>
        ))}</div>
        <div>{m.ieGroups.map((g, gi) => g.exclusions.length > 0 && (
          <div key={gi}><h2 className="lx-h">Not included{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</h2>{g.exclusions.map((x, i) => <div className="lx-li off" key={i}>◇ {x}</div>)}</div>
        ))}</div>
      </div>
      <Sign m={m} light />
      <Powered light />
    </div>
  </>
}

/* ================= premium section helpers ================= */
/* render the configured, reordered sections of a premium sheet */
function Sections({ cfg, reg }) {
  const on = cfg.sections.filter((s) => s.on && reg[s.id])
  const firstId = on[0]?.id
  return on.map((s) => (
    <div key={s.id} className={`pdf-sec sec-${s.id} ${s.id === firstId ? 'is-first' : ''}`}>
      {reg[s.id](s.id === firstId)}
    </div>
  ))
}

function heroOverlay(cfg) {
  const o = cfg.overlay ?? 0.55
  return `linear-gradient(180deg, ${rgba('#150d08', o * 0.18)} 0%, ${rgba('#150d08', o * 0.55)} 48%, ${rgba('#150d08', Math.min(0.92, o + 0.28))} 100%)`
}

/* ================= V5 · Holiday (premium, customisable) ================= */
function Holiday({ m, cfg }) {
  const title = cfg.headline?.trim() || m.destTitle
  const reg = {
    cover: (first) => (
      <div className={`hd-hero ${first ? 'first' : ''}`}>
        <Img src={m.cover} className="hd-hero-img" overlay={heroOverlay(cfg)}>
          <div className="hd-hero-top">
            <AgencyLogo agency={m.agency} className="hd-logo" fallback="none" />
            <span className="hd-hero-kicker">Curated by {m.agency.name}</span>
          </div>
          <div className="hd-hero-btm">
            <div className="hd-hero-l">
              <span className="hd-hero-eyebrow">Your journey to</span>
              <h1 className="hd-title">{title}</h1>
              <div className="hd-dates"><i className="hd-dot" />{fmtD(m.start, { day: 'numeric', month: 'short' })} – {fmtD(m.end, { day: 'numeric', month: 'short' })} · {m.nights}N / {m.daysCount}D</div>
            </div>
            {cfg.showPrice && m.total > 0 && <div className="hd-price"><span>{m.optionName ? m.optionName + ' · ' : ''}Package price</span><strong>{money(m.total)}</strong></div>}
          </div>
        </Img>
        {m.gallery.length > 1 && cfg.coverStyle === 'postcard' && (
          <div className="hd-hero-strip">{m.gallery.slice(1, 5).map((u, i) => <Img key={i} src={u} className="hd-strip-img" />)}</div>
        )}
      </div>
    ),
    trust: () => (
      <div className="hd-badges pdf-avoid">
        {[['◎', 'Complete pre-trip & on-trip assistance'], ['✓', 'No hidden charges — all-inclusive'], ['✦', 'Verified hotels & cabs']].map(([g, t], i) => (
          <div className="hd-badge" key={i}><i>{g}</i>{t}</div>
        ))}
      </div>
    ),
    guest: () => (
      <div className="hd-guest pdf-avoid">
        <div className="hd-guest-c"><span>Guest</span><strong>{m.client}</strong></div>
        <div className="hd-guest-c"><span>Travellers</span><strong>{m.paxLine}</strong></div>
        <div className="hd-guest-c"><span>Reference</span><strong>{m.code}</strong></div>
      </div>
    ),
    schedule: () => (
      <>
        <SecH id="schedule">Trip schedule</SecH>
        <div className="hd-sched pdf-avoid">
          {m.days.map((d, i) => (
            <div className="hd-sch" key={d.n}>
              <div className="hd-sch-rail"><span className="hd-sch-node" />{i < m.days.length - 1 && <span className="hd-sch-stem" />}</div>
              <div className="hd-sch-date">{fmtD(addDays(m.start, d.n - 1), { day: '2-digit', month: 'short' })}<em>Day {d.n}</em></div>
              <div className="hd-sch-b">
                <div className="hd-sch-t">{d.title}{d.city ? ` · ${d.city}` : ''}</div>
                <div className="hd-chips">
                  {d.transfers.map((t, x) => <span className="hd-chip tr" key={`t${x}`}>{t.location || 'Transfer'}</span>)}
                  {d.activities.map((a, x) => <span className="hd-chip" key={`a${x}`}>{a.location || 'Activity'}</span>)}
                  {d.meal && <span className="hd-chip meal">{d.meal}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    itinerary: () => (
      <>
        <SecH id="itinerary">Day-by-day itinerary</SecH>
        {m.days.map((d) => (
          <div className="hd-day pdf-avoid" key={d.n}>
            <div className="hd-day-head">
              <span className="hd-day-badge">{ORD(d.n)}<em>Day</em></span>
              <div className="hd-day-hm">
                <div className="hd-day-date">{fmtD(addDays(m.start, d.n - 1), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                <div className="hd-day-t">{d.title}{d.city ? ` — ${d.city}` : ''}</div>
              </div>
            </div>
            {d.desc && <p className="hd-day-p">{d.desc}</p>}
            {d.transfers.map((t, i) => (
              <div className={`hd-tr ${t.image && cfg.showDayImages ? 'has-img' : ''}`} key={`t${i}`}>
                {t.image && cfg.showDayImages ? <Img src={t.image} className="hd-tr-img" /> : <span className="hd-tr-ic"></span>}
                <span><strong>{t.location || 'Transfer'}</strong>{t.serviceType ? ` · ${t.serviceType}` : ''}{t.description && <div className="hd-tr-d">{t.description}</div>}</span>
              </div>
            ))}
            {d.activities.map((a, i) => (
              <div className="hd-act" key={`a${i}`}>
                {cfg.showDayImages && <Img src={a.image} className="hd-act-img">{!a.image && <span>{(a.location || '').slice(0, 1)}</span>}</Img>}
                <div className="hd-act-b">
                  <div className="hd-act-t">{a.location || 'Activity'}</div>
                  {a.description && <p className="hd-act-p">{a.description}</p>}
                  <div className="hd-act-note">✓ {a.serviceType || 'Included as per itinerary'}</div>
                </div>
              </div>
            ))}
            {d.meal && <div className="hd-meal">Meals included: {d.meal}</div>}
          </div>
        ))}
      </>
    ),
    hotels: () => (
      <>
        <SecH id="hotels">Where you’ll stay</SecH>
        {m.options.map((o, oi) => (
          <div key={oi}>
            {m.options.length > 1 && <div className="hd-opt">Option {oi + 1}: {o.name}</div>}
            {o.stays.map((s, i) => {
              const gal = (s.gallery?.length ? s.gallery : [s.image, ...m.gallery]).filter(Boolean).slice(0, 5)
              const shown = gal.length ? gal : ['']
              return (
                <div className="hd-hotel pdf-avoid" key={i}>
                  <div className={`hd-gal n${Math.min(shown.length, 5)}`}>{shown.map((g, x) => <Img key={x} src={g} className="hd-gal-img" />)}</div>
                  <div className="hd-hotel-b">
                    <div className="hd-hotel-n">{s.name} <Stars n={s.star} /></div>
                    <div className="hd-hotel-sub">{[s.city, `${s.nightsCount} night${s.nightsCount > 1 ? 's' : ''}`, `Check-in ${fmtD(s.checkIn, { day: '2-digit', month: 'short' })}`, `Check-out ${fmtD(s.checkOut, { day: '2-digit', month: 'short' })}`].filter(Boolean).join('   ·   ')}</div>
                    <div className="hd-hotel-tags"><span className="hd-tag2">{s.room || 'Room'}</span>{s.meal && <span className="hd-tag2 green">{s.meal}</span>}</div>
                    {s.desc && <p className="hd-hotel-p">{s.desc}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </>
    ),
    flights: () => (m.flights.length > 0 ? <><SecH id="flights">Flights</SecH><FlightTable m={m} /></> : null),
    inclusions: () => {
      const inc = m.ieGroups.some((g) => g.inclusions.length), exc = m.ieGroups.some((g) => g.exclusions.length)
      if (!inc && !exc) return null
      return (
        <>
          <SecH id="inclusions">Inclusions &amp; exclusions</SecH>
          <div className="hd-cols pdf-avoid">
            <div>{m.ieGroups.map((g, gi) => g.inclusions.length > 0 && (
              <div key={gi}><h3 className="hd-h3 green">Inclusions{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</h3>{g.inclusions.map((x, i) => <div className="hd-li inc" key={i}><i />{x}</div>)}</div>
            ))}</div>
            <div>{m.ieGroups.map((g, gi) => g.exclusions.length > 0 && (
              <div key={gi}><h3 className="hd-h3 red">Exclusions{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</h3>{g.exclusions.map((x, i) => <div className="hd-li exc" key={i}><i />{x}</div>)}</div>
            ))}</div>
          </div>
        </>
      )
    },
    notes: () => (m.remarks ? <div className="hd-notes pdf-avoid"><h3 className="hd-h3">Please note</h3><p>{m.remarks}</p></div> : null),
    signature: () => (<div className="hd-sign pdf-avoid"><Sign m={m} /><Powered /></div>),
  }
  return (
    <div className="pdf-page hd-sheet">
      <Deco cfg={cfg} m={m} />
      <div className="hd-content">
        <Sections cfg={cfg} reg={reg} />
      </div>
    </div>
  )
}

/* ================= V6 · Coastal (premium, customisable) ================= */
function Coastal({ m, cfg }) {
  const title = cfg.headline?.trim() || m.destTitle
  const svcRows = m.days.flatMap((d) => [
    ...d.transfers.map((t) => ({ day: d.n, date: addDays(m.start, d.n - 1), label: t.location || 'Transfer', kind: 'Transfer' })),
    ...d.activities.map((a) => ({ day: d.n, date: addDays(m.start, d.n - 1), label: a.location || 'Activity', kind: a.serviceType || 'Activity' })),
  ])
  const reg = {
    letter: () => (
      <div className="pdf-avoid">
        <div className="cs-brandbar">
          <AgencyLogo agency={m.agency} className="cs-logo" />
          <div className="cs-brand-r">{m.agency.website && <div>{m.agency.website}</div>}{m.agency.phone && <div>{m.agency.phone}</div>}</div>
        </div>
        <div className="cs-letter">
          <span className="cs-eyebrow">Personalised itinerary</span>
          <h1 className="cs-headline">{title}</h1>
          <p className="cs-dear">Dear {m.client},</p>
          <p className="cs-greet">{cfg.intro?.trim() || <>Greetings from <strong>{m.agency.name}</strong>. Please find your personalised itinerary for <strong>{m.destTitle}</strong> below — we've hand-picked every stay, transfer and experience worth your time. Do let us know if you'd like any changes.</>}</p>
        </div>
      </div>
    ),
    info: () => (
      <div className="cs-info pdf-avoid">
        <div className="cs-info-c"><span>Destination</span><strong>{m.destTitle}</strong></div>
        <div className="cs-info-c"><span>Start date</span><strong>{fmtD(m.start)}</strong></div>
        <div className="cs-info-c"><span>Duration</span><strong>{m.nights} Nights / {m.daysCount} Days</strong></div>
        <div className="cs-info-c"><span>Travellers</span><strong>{m.paxLine}</strong></div>
        <div className="cs-info-c"><span>Trip ID</span><strong>{m.code}</strong></div>
        <div className="cs-info-c"><span>Travel dates</span><strong>{fmtD(m.start, { day: '2-digit', month: 'short' })} – {fmtD(m.end, { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
      </div>
    ),
    quote: () => (cfg.showPrice && m.total > 0 ? (
      <div className="cs-quote pdf-avoid">
        <div className="cs-bar sm">Quote price</div>
        <div className="cs-quote-grid">
          <div className="cs-quote-cell"><span>Total (INR)</span><strong>{money(m.total)}</strong><em>including all taxes{m.optionName ? ` · ${m.optionName}` : ''}</em></div>
          <div className="cs-quote-cell"><span>Per person</span><strong>{money(m.perPax)}</strong><em>{m.adults + m.children || 1} traveller{(m.adults + m.children) === 1 ? '' : 's'}</em></div>
        </div>
      </div>
    ) : null),
    cover: () => (m.cover ? <Img src={m.cover} className="cs-cover-band pdf-avoid"><span className="cs-cover-cap">{m.destTitle}</span></Img> : null),
    hotels: () => (
      <>
        <div className="cs-bar">Hotels / Accommodations</div>
        <HotelTable m={m} className="coastal" />
      </>
    ),
    services: () => (svcRows.length > 0 ? (
      <>
        <div className="cs-bar">Transport &amp; Activities</div>
        <table className="pdf-table cs-table">
          <thead><tr><th>Day</th><th>Service</th><th>Type</th></tr></thead>
          <tbody>{svcRows.map((r, i) => (
            <tr key={i}><td>Day {r.day} · {fmtD(r.date, { day: '2-digit', month: 'short' })}</td><td>{r.label}</td><td>{r.kind}</td></tr>
          ))}</tbody>
        </table>
      </>
    ) : null),
    flights: () => (m.flights.length > 0 ? <><div className="cs-bar">Flights</div><FlightTable m={m} /></> : null),
    itinerary: () => (
      <>
        <div className="cs-bar">Day-wise itinerary</div>
        {m.days.map((d) => (
          <div className="cs-day pdf-avoid" key={d.n}>
            <div className="cs-day-head">
              <span className="cs-day-badge">{ORD(d.n)}<em>Day</em></span>
              <div className="cs-day-hm">
                <div className="cs-day-date">{fmtD(addDays(m.start, d.n - 1), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div className="cs-day-t">{d.title}{d.city ? ` — ${d.city}` : ''}</div>
              </div>
            </div>
            {(() => {
              const hasItemImgs = cfg.showDayImages && (d.transfers.some((t) => t.image) || d.activities.some((a) => a.image))
              return <>
                {/* full-width day banner only when there are no per-item photos to show */}
                {cfg.showDayImages && d.image && !hasItemImgs && <Img src={d.image} className="cs-day-img" />}
                {d.desc && <p className="cs-day-p">{d.desc}</p>}
                {d.transfers.map((t, i) => (t.image && cfg.showDayImages ? (
                  <div className="cs-item" key={`t${i}`}>
                    <Img src={t.image} className="cs-item-img" />
                    <div className="cs-item-b"><strong>Transfer · {t.location || '—'}</strong>{t.description && <p>{t.description}</p>}</div>
                  </div>
                ) : <p className="cs-line" key={`t${i}`}><strong>Transfer:</strong> {t.location || '—'}{t.description ? ` — ${t.description}` : ''}</p>))}
                {d.activities.map((a, i) => (a.image && cfg.showDayImages ? (
                  <div className="cs-item" key={`a${i}`}>
                    <Img src={a.image} className="cs-item-img" />
                    <div className="cs-item-b"><strong>{a.location || 'Activity'}</strong>{(a.description || a.serviceType) && <p>{a.description || a.serviceType}</p>}</div>
                  </div>
                ) : <p className="cs-line" key={`a${i}`}><strong>{a.location || 'Activity'}:</strong> {a.description || a.serviceType || 'Included as per itinerary'}</p>))}
                {d.meal && <p className="cs-line"><strong>Meals:</strong> {d.meal}</p>}
              </>
            })()}
          </div>
        ))}
      </>
    ),
    inclusions: () => {
      const inc = m.ieGroups.some((g) => g.inclusions.length), exc = m.ieGroups.some((g) => g.exclusions.length)
      if (!inc && !exc) return null
      return (
        <>
          <div className="cs-bar">Inclusions &amp; exclusions</div>
          <div className="cs-cols pdf-avoid">
            <div>{m.ieGroups.map((g, gi) => g.inclusions.length > 0 && (
              <div key={gi}><h3 className="cs-h3 green">Inclusions{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</h3>{g.inclusions.map((x, i) => <div className="cs-li inc" key={i}>✓ {x}</div>)}</div>
            ))}</div>
            <div>{m.ieGroups.map((g, gi) => g.exclusions.length > 0 && (
              <div key={gi}><h3 className="cs-h3 red">Exclusions{m.ieMulti && g.destination ? ` · ${g.destination}` : ''}</h3>{g.exclusions.map((x, i) => <div className="cs-li exc" key={i}>✕ {x}</div>)}</div>
            ))}</div>
          </div>
        </>
      )
    },
    notes: () => (m.remarks ? <><div className="cs-bar">Notes</div><p className="cs-day-p pdf-avoid">{m.remarks}</p></> : null),
    signature: () => (<div className="cs-sign pdf-avoid"><Sign m={m} /><Powered /></div>),
  }
  return (
    <div className="pdf-page cs-sheet">
      <Deco cfg={cfg} m={m} />
      <div className="cs-content">
        <Sections cfg={cfg} reg={reg} />
      </div>
    </div>
  )
}
