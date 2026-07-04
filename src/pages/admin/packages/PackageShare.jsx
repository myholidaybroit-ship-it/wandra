import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { Button, Modal } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './share.css'

export default function PackageShare() {
  const { id } = useParams()
  const { packages, clients, agency, toast } = useApp()
  const [waOpen, setWaOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfV, setPdfV] = useState('classic')
  const pkg = packages.find((p) => p.id === id)
  if (!pkg) return <div className="pshare-missing">Quote not found. <Link className="c-link" to="/app/packages">Back to packages</Link></div>

  const client = clients.find((c) => c.id === pkg.clientId)
  const link = `${window.location.origin}/i/${pkg.code}`
  const total = pkg.pricing?.grandTotal || 0
  const firstName = (client?.name || pkg.clientName || '').split(' ').slice(-1)[0]
  const msg = `Hi${firstName ? ` ${firstName}` : ''}! Here's your travel quote ${pkg.code} — ${pkg.destination} (${pkg.nights}N / ${pkg.days}D). View it here: ${link}`
  const phone = (pkg.clientPhone || client?.phone || '').replace(/\D/g, '')
  const email = pkg.clientEmail || client?.email || ''

  const waMsg = buildWaMessage(pkg, client, agency)
  const mail = buildEmail(pkg, client, agency)
  const onWhatsApp = () => setWaOpen(true)
  const openWa = () => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`, '_blank')
  const copyWa = () => { navigator.clipboard?.writeText(waMsg); toast('WhatsApp message copied') }
  const onEmail = () => setEmailOpen(true)
  const openMail = () => { window.location.href = `mailto:${email}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}` }
  const copyMail = () => { navigator.clipboard?.writeText(`Subject: ${mail.subject}\n\n${mail.body}`); toast('Email copied') }
  const onPdf = () => setPdfOpen(true)
  const pdfUrl = (variant, dl) => `/pdf/${pkg.code}?v=${variant}${dl ? '&download=1' : ''}`

  const ACTIONS = [
    { key: 'whatsapp', label: 'WhatsApp', sub: 'Send on WhatsApp', tone: 'wa', onClick: onWhatsApp, icon: <WhatsAppIcon /> },
    { key: 'email', label: 'Email', sub: 'Send via email', tone: 'email', onClick: onEmail, icon: <MailIcon /> },
    { key: 'pdf', label: 'PDF', sub: '5 layouts · preview & download', tone: 'pdf', onClick: onPdf, icon: <PdfIcon /> },
  ]

  return (
    <div className="pshare">
      <div className="pshare-inner">
        <div className="pshare-badge"><Icon name="check" size={24} strokeWidth={2.4} /></div>
        <h1 className="pshare-title">Quote ready to share</h1>
        <p className="pshare-sub"><span className="mono">{pkg.code}</span> · {pkg.destination} · <strong>{inr(total)}</strong></p>

        <div className="pshare-grid">
          {ACTIONS.map((a) => (
            <button key={a.key} className={`pshare-btn tone-${a.tone}`} onClick={a.onClick}>
              <span className="pshare-ic">{a.icon}</span>
              <span className="pshare-label">{a.label}</span>
              <span className="pshare-desc">{a.sub}</span>
            </button>
          ))}
        </div>

        <div className="pshare-foot">
          <Link to={`/app/packages/${pkg.id}`} className="pshare-link">Open full package →</Link>
          {client && <Link to={`/app/clients/${client.id}`} className="pshare-link muted">Back to {client.name}</Link>}
        </div>
      </div>

      <Modal open={waOpen} onClose={() => setWaOpen(false)} title="WhatsApp message" width={640}
        footer={<>
          <Button variant="tertiary" onClick={() => setWaOpen(false)}>Close</Button>
          <Button variant="secondary" onClick={copyWa}><Icon name="copy" size={14} /> Copy message</Button>
          <Button onClick={openWa}>Open WhatsApp</Button>
        </>}>
        <p className="wa-hint">This is auto-built from the quote. Copy it and paste into WhatsApp, or hit Open WhatsApp.</p>
        <div className="wa-preview">{waMsg}</div>
      </Modal>

      <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title="Email" width={700}
        footer={<>
          <Button variant="tertiary" onClick={() => setEmailOpen(false)}>Close</Button>
          <Button variant="secondary" onClick={copyMail}><Icon name="copy" size={14} /> Copy email</Button>
          <Button onClick={openMail}>Open in email</Button>
        </>}>
        <p className="wa-hint">A ready-to-send email, auto-built from the quote. Copy it, or hit Open in email to compose.</p>
        <div className="em-subject"><span className="em-subject-k">Subject</span><span className="em-subject-v">{mail.subject}</span></div>
        <div className="wa-preview">{mail.body}</div>
      </Modal>

      <Modal open={pdfOpen} onClose={() => setPdfOpen(false)} title="Download PDF" width={960}
        footer={<>
          <Button variant="tertiary" onClick={() => setPdfOpen(false)}>Close</Button>
          <Button variant="secondary" onClick={() => window.open(pdfUrl(pdfV), '_blank')}>Open full preview ↗</Button>
          <Button onClick={() => window.open(pdfUrl(pdfV, true), '_blank')}><Icon name="upload" size={14} className="pdf-dl-ic" /> Download PDF</Button>
        </>}>
        <div className="pdfm">
          <div className="pdfm-list">
            {PDF_VARIANTS.map((va) => (
              <button key={va.key} className={`pdfm-item ${pdfV === va.key ? 'on' : ''}`} onClick={() => setPdfV(va.key)}>
                <span className={`pdfm-thumb th-${va.key}`}><i /><i /><i /></span>
                <span className="pdfm-item-b">
                  <span className="pdfm-item-t">{va.name}</span>
                  <span className="pdfm-item-d">{va.desc}</span>
                </span>
              </button>
            ))}
            <p className="pdfm-hint">Download saves a real PDF file of the selected layout.</p>
          </div>
          <div className="pdfm-preview">
            <iframe key={pdfV} title="PDF preview" src={pdfUrl(pdfV)} className="pdfm-frame" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

const PDF_VARIANTS = [
  { key: 'classic', name: 'Classic Document', desc: 'Agent-style quote — red headings, tables, day-wise detail' },
  { key: 'vivid', name: 'Vivid Cover', desc: 'Full-bleed cover, hotel cards, day badges with colour' },
  { key: 'mono', name: 'Wandra Minimal', desc: 'Black & white brand look — clean grids, big type' },
  { key: 'luxe', name: 'Luxe Dark', desc: 'Premium dark pages with gold serif accents' },
  { key: 'compact', name: 'Compact One-Pager', desc: 'The whole quote on a single A4 page' },
]

function WhatsAppIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.17 0 4.2.85 5.74 2.38a8.06 8.06 0 0 1 2.38 5.73c0 4.47-3.64 8.11-8.12 8.11a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.06.8.82-2.99-.2-.31a8.05 8.05 0 0 1-1.24-4.31c0-4.47 3.64-8.1 8.11-8.1Zm-4.5 4.35c-.2 0-.53.08-.81.38-.28.3-1.07 1.04-1.07 2.54s1.1 2.94 1.25 3.15c.15.2 2.13 3.34 5.29 4.55.74.28 1.31.45 1.76.58.74.23 1.41.2 1.94.12.59-.09 1.82-.74 2.08-1.46.26-.72.26-1.33.18-1.46-.07-.13-.27-.2-.57-.35-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57Z" />
    </svg>
  )
}
function MailIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  )
}
function PdfIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M9 13h6M9 17h4" />
    </svg>
  )
}

/* ---------- Dynamic WhatsApp itinerary message ---------- */
const B = (s) => `*${s}*`
const N = (v) => Number(v) || 0
function fmtD(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d)) return iso
  return `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('en-US', { month: 'short' })}-${d.getFullYear()}`
}
function addDays(iso, n) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function buildWaMessage(pkg, client, agency) {
  const L = []
  const opts = pkg.builderV2?.options || []
  const activeOpt = opts[pkg.activeOption ?? 0] || opts[0] || {}
  const start = pkg.startDate
  const end = addDays(start, pkg.nights || 0)
  const pax = pkg.pax || {}
  const total = N(pax.adults) + N(pax.children) + N(pax.infants)
  const sectors = (pkg.sectors || []).filter((s) => s.destination)
  const destTitle = sectors.map((s) => s.destination).join(' ') || (pkg.destination || '').split(' - ')[0]

  L.push(`🌿 ${B(`${destTitle} Package ${pkg.nights} Night ${pkg.days} Days`)} - ${B(agency.name)} 🌿`)
  L.push('')
  L.push(`✨ ${B('Your Trip Itinerary')} ✨`)
  L.push(`👤 ${B('Package Code')}: ${pkg.code}`)
  L.push(`📅 ${B(`${fmtD(start)} – ${fmtD(end)}`)}, ${B('Days:')} ${pkg.days}`)
  L.push(`👤 ${B('Traveler')}: ${total}`)
  L.push(`👤 ${B('Adults')}: ${N(pax.adults)} 👶 ${B('Children')}: ${N(pax.children)} 👶 ${B('Infants')}: ${N(pax.infants)}`)
  L.push(`📍 ${B('Destinations')}: ${sectors.map((s) => B(s.destination)).join(' ') || B(destTitle)}`)

  // Hotels — per option
  if (opts.some((o) => o.stays && o.stays.length)) {
    L.push('', `🏨 ${B('Hotel Details')}`)
    opts.forEach((o, oi) => {
      if (!o.stays || !o.stays.length) return
      L.push('', `🏷️ ${B(`Option ${oi + 1}${o.name ? `: ${o.name}` : ''}`)}`)
      o.stays.forEach((st, hi) => {
        const ns = st.nights && st.nights.length ? st.nights : [1]
        L.push('')
        L.push(`📍 ${B(`Hotel ${hi + 1}`)}`)
        L.push(`🏨 ${B('Hotel Name')}: ${st.hotelName || '—'}`)
        L.push(`📌 ${B('Location')}: ${st.hotelCity || '—'}`)
        L.push(`🛬 ${B('Check-in')}: ${fmtD(addDays(start, Math.min(...ns) - 1))}`)
        L.push(`🛫 ${B('Check-out')}: ${fmtD(addDays(start, Math.max(...ns)))}`)
        L.push(`🍽️ ${B('Meal')}: ${st.mealPlan || '—'}`)
        if (st.hotelStar) L.push(`⭐️ ${B('Hotel type')}: ${st.hotelStar} Star`)
      })
    })
  }

  // Flights — active option
  const flights = activeOpt.flights || []
  if (flights.length) {
    L.push('', `✈️ ${B('Flight Details')}`)
    flights.forEach((f, fi) => {
      L.push('')
      L.push(`📍 ${B('Flight')} ${fi + 1}`)
      L.push(`🛫 ${B('Airline')}: ${f.airline || '—'}`)
      L.push(`🔢 ${B('Flight No')}: ${f.flightNo || '—'}`)
      L.push(`🌍 ${B('From')}: ${f.fromCity || f.fromCode || '—'}`)
      L.push(`📍 ${B('To')}: ${f.toCity || f.toCode || '—'}`)
      if (f.depDate || f.depTime) L.push(`🕓 ${B('Departure')}: ${fmtD(f.depDate)}${f.depTime ? ` ${f.depTime}` : ''}`)
      if (f.arrDate || f.arrTime) L.push(`🕔 ${B('Arrival')}: ${fmtD(f.arrDate)}${f.arrTime ? ` ${f.arrTime}` : ''}`)
      L.push(`💺 ${B('Class')}: ${f.cabinClass || 'Economy'}`)
      L.push(`💰 ${B('Price')}: ₹${N(f.sell)}`)
    })
  }

  // Day-wise itinerary
  const services = activeOpt.services || []
  ;(pkg.itinerary || []).forEach((d) => {
    const city = d.stops?.[0]?.destination || d.title
    L.push('')
    L.push(`📆 ${B(`Day – ${d.day}`)}`)
    if (city) L.push(`🛬 ${B(city)}`)
    if (d.title) L.push(`🕒 ${B('Name')}: ${d.title}`)
    if (d.description) L.push(`🕒 ${B('Description')}: ${d.description}`)
    services.filter((s) => s.kind === 'transport' && (s.days || []).includes(d.day)).forEach((tr) => {
      L.push(`🚗 ${B('Transfer Details')}`)
      L.push(`📍 ${B('Service')}: ${tr.location || '—'}${tr.serviceType ? ` (${tr.serviceType})` : ''}`)
      if (tr.cabName) L.push(`🚖 ${B('Vehicle')}: ${tr.cabName}`)
      L.push(`👥 ${B('Quantity')}: ${N(tr.qty) || 1}`)
      if (tr.description) L.push(`📝 ${B('Remarks')}: ${tr.description}`)
    })
    services.filter((s) => s.kind === 'activity' && (s.days || []).includes(d.day)).forEach((a) => {
      L.push(`🎯 ${B('Activity Details')}`)
      L.push(`🎟 ${B('Activity')}: ${a.location || '—'}`)
      if (a.serviceType) L.push(`🔖 ${B('Type')}: ${a.serviceType}`)
      L.push(`👥 ${B('Quantity')}: ${N(a.qty) || 1}`)
      L.push(`💰 ${B('Price')}: ₹${N(a.given)}`)
      if (a.description) L.push(`📝 ${B('Description')}: ${a.description}`)
    })
  })

  // Inclusions / Exclusions
  if ((pkg.inclusions || []).length) { L.push('', `✅ ${B('Inclusion')}`, ''); pkg.inclusions.forEach((x) => L.push(`🔸 ${x}`)) }
  if ((pkg.exclusions || []).length) { L.push('', `❌ ${B('Exclusion')}`, ''); pkg.exclusions.forEach((x) => L.push(`🔸 ${x}`)) }
  if (pkg.customerRemarks) { L.push('', `📃 ${B('Remarks')}`, pkg.customerRemarks) }

  // Contact
  L.push('')
  L.push("Feel free to reach out with any questions or if you'd like to book your trip.")
  L.push(`📞 ${B('Emergency Contact')}:`)
  L.push(`🏢 ${agency.name}`)
  if (agency.phone) L.push(`📱 ${agency.phone}`)
  if (agency.email) L.push(`📧 ${agency.email}`)
  L.push(`🌟 ${B('Wishing you a wonderful journey!')}`)
  L.push('Let us know if you need anything. 😊')

  return L.join('\n')
}

/* ---------- Proper email format (subject + professional body) ---------- */
export function buildEmail(pkg, client, agency) {
  const opts = pkg.builderV2?.options || []
  const activeOpt = opts[pkg.activeOption ?? 0] || opts[0] || {}
  const start = pkg.startDate
  const end = addDays(start, pkg.nights || 0)
  const pax = pkg.pax || {}
  const sectors = (pkg.sectors || []).filter((s) => s.destination)
  const destTitle = sectors.map((s) => s.destination).join(', ') || (pkg.destination || '').split(' - ')[0]
  const name = client?.name || pkg.clientName || 'Traveller'
  const money = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`

  const subject = `Your ${destTitle} Travel Quote — ${pkg.code}`
  const L = []
  L.push(`Dear ${name},`)
  L.push('')
  L.push(`Thank you for your enquiry. We're delighted to share your personalised travel quote for ${destTitle} below.`)
  L.push('')
  L.push('TRIP OVERVIEW')
  L.push(`Quote reference: ${pkg.code}`)
  L.push(`Destination: ${destTitle}`)
  L.push(`Travel dates: ${fmtD(start)} to ${fmtD(end)}`)
  L.push(`Duration: ${pkg.nights} Nights / ${pkg.days} Days`)
  L.push(`Travellers: ${N(pax.adults)} Adults${N(pax.children) ? `, ${N(pax.children)} Children` : ''}${N(pax.infants) ? `, ${N(pax.infants)} Infants` : ''}`)

  if (opts.some((o) => o.stays && o.stays.length)) {
    L.push('', 'ACCOMMODATION')
    opts.forEach((o, oi) => {
      if (!o.stays || !o.stays.length) return
      L.push(`Option ${oi + 1}${o.name ? `: ${o.name}` : ''}`)
      o.stays.forEach((st) => {
        const ns = st.nights && st.nights.length ? st.nights : [1]
        L.push(`  - ${st.hotelName || '—'}${st.hotelCity ? ` — ${st.hotelCity}` : ''}${st.hotelStar ? ` (${st.hotelStar} Star)` : ''}`)
        L.push(`    ${fmtD(addDays(start, Math.min(...ns) - 1))} to ${fmtD(addDays(start, Math.max(...ns)))}${st.roomType ? ` · ${st.roomType}` : ''}${st.mealPlan ? ` · ${st.mealPlan}` : ''}`)
      })
    })
  }

  const flights = activeOpt.flights || []
  if (flights.length) {
    L.push('', 'FLIGHTS')
    flights.forEach((f) => {
      L.push(`  - ${f.airline || '—'} ${f.flightNo || ''} — ${f.fromCity || f.fromCode || '—'} to ${f.toCity || f.toCode || '—'}`)
      const dep = [fmtD(f.depDate), f.depTime].filter(Boolean).join(' ')
      const arr = [fmtD(f.arrDate), f.arrTime].filter(Boolean).join(' ')
      if (dep || arr) L.push(`    Departs ${dep || '—'} · Arrives ${arr || '—'} · ${f.cabinClass || 'Economy'}`)
    })
  }

  const services = activeOpt.services || []
  if ((pkg.itinerary || []).length) {
    L.push('', 'DAY-WISE ITINERARY')
    pkg.itinerary.forEach((d) => {
      const city = d.stops?.[0]?.destination || ''
      L.push('')
      L.push(`Day ${d.day}${city ? ` — ${city}` : ''}`)
      if (d.title) L.push(`  ${d.title}`)
      if (d.description) L.push(`  ${d.description}`)
      services.filter((s) => s.kind === 'transport' && (s.days || []).includes(d.day)).forEach((tr) => {
        L.push(`  Transfer: ${tr.location || '—'}${tr.serviceType ? ` (${tr.serviceType})` : ''}${tr.cabName ? ` — ${tr.cabName}` : ''}`)
        if (tr.description) L.push(`    ${tr.description}`)
      })
      services.filter((s) => s.kind === 'activity' && (s.days || []).includes(d.day)).forEach((a) => {
        L.push(`  Activity: ${a.location || '—'}`)
        if (a.description) L.push(`    ${a.description}`)
      })
    })
  }

  if ((pkg.inclusions || []).length) { L.push('', 'INCLUSIONS'); pkg.inclusions.forEach((x) => L.push(`  - ${x}`)) }
  if ((pkg.exclusions || []).length) { L.push('', 'EXCLUSIONS'); pkg.exclusions.forEach((x) => L.push(`  - ${x}`)) }
  if (pkg.pricing?.grandTotal) { L.push('', 'PACKAGE PRICE'); L.push(`  ${money(pkg.pricing.grandTotal)}${activeOpt.name ? ` (${activeOpt.name})` : ''}`) }
  if (pkg.customerRemarks) { L.push('', 'NOTES'); L.push(`  ${pkg.customerRemarks}`) }

  L.push('')
  L.push("We'd be delighted to answer any questions or tailor this further. Simply reply to this email or call us and we'll take care of the rest.")
  L.push('')
  L.push('Warm regards,')
  L.push(agency.name)
  const contact = [agency.phone, agency.email].filter(Boolean).join(' · ')
  if (contact) L.push(contact)
  if (agency.website) L.push(agency.website)
  if (agency.address) L.push(agency.address)

  return { subject, body: L.join('\n') }
}
