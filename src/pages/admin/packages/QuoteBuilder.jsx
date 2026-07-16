import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { Button, Field, Input, PillSelect, DatePicker, Modal } from '../../../components/ui/UI'
import { ImageInput } from '../../../components/ui/ImageInput'
import { Icon } from '../../../components/ui/icons'
import './builder.css'

/* ---------- reference lists ---------- */
const MEAL_PLANS = ['EP', 'CP', 'HB', 'MAP', 'AP']
const MEAL_LABEL = { EP: 'EP · Room only', CP: 'CP · Breakfast', HB: 'HB · Breakfast + Dinner', MAP: 'MAP · Breakfast + Dinner', AP: 'AP · All meals' }
const ROOM_TYPES = ['Standard', 'Deluxe', 'Superior', 'Premium', 'Suite', 'Cottage', 'Pool Villa', 'Houseboat']
const SERVICE_TYPES = ['Arrival Transfer', 'Departure Transfer', 'Intercity Transfer', 'Sightseeing', 'Excursion', 'Half-day Transfer', 'Full-day Transfer']
const COMP_CHILD = ['No comp', 'Upto 5y (0C)', 'Upto 6y (0C)', 'Upto 8y (0C)', 'Upto 11y (0C)']
const STARS = ['3 Star', '4 Star', '5 Star', 'Luxury']
const ROUND_OPTS = [0, 100, 500, 1000]
const PRICING_DEFAULTS = { markupMode: 'percent', markupValue: 20, taxOn: 'cost_markup', taxEnabled: true, taxPercent: 5, roundTo: 0, customerRemarks: '' }
// A package that has already moved past the quote stage must never be pulled
// back to Draft/Quoted by re-saving the builder.
const LOCKED_STATUSES = ['Booked', 'Confirmed', 'Completed', 'Cancelled']

let seq = 0
const uid = () => `b${++seq}`
const num = (v) => Number(v) || 0

/* ---------- date helpers ---------- */
const ORD = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]) }
function offDate(startISO, off, opts = { day: 'numeric', month: 'short' }) {
  if (!startISO) return ''
  const d = new Date(startISO + 'T00:00:00'); d.setDate(d.getDate() + off)
  return d.toLocaleDateString('en-IN', opts)
}
const chipDate = (startISO, off) => offDate(startISO, off, { weekday: 'short', day: 'numeric', month: 'short' })
const longDate = (startISO, off) => offDate(startISO, off, { weekday: 'long', day: 'numeric', month: 'short' })

/* ============================================================
   Quote Builder — Sembark-style sections, Wandra styling
   ============================================================ */
export default function QuoteBuilder() {
  const { clients, hotels, cabs, destinations, packages, packageTemplates, serviceLocations, activities, addPackage, updatePackage, toast, inclusionPresets, canSeePricing, templates } = useApp()
  const activityCats = [...new Set((activities || []).map((a) => a.category))]
  const nav = useNavigate()
  const { id: editId } = useParams()
  const [sp] = useSearchParams()
  const editing = packages.find((p) => p.id === editId)
  const preClient = clients.find((x) => x.id === sp.get('client')) || clients.find((x) => x.id === editing?.clientId)
  const startTpl = sp.get('template') ? (packageTemplates || []).find((t) => t.id === sp.get('template')) : null

  const [q, setQ] = useState(() => init(editing, preClient, startTpl, hotels, inclusionPresets))

  /* ---------- inclusions / exclusions — kept per destination, seeded from that
       destination's own master presets (falls back to the general list) ---------- */
  const presetsFor = (dest) => presetsForDest(inclusionPresets, dest)
  const defaultIE = (dest) => ({ inclusions: [...presetsFor(dest).inclusions], exclusions: [...presetsFor(dest).exclusions] })
  const ieFor = (dest) => q.ieByDest?.[dest] || defaultIE(dest)
  const setIE = (dest, updater) => setQ((s) => {
    const cur = s.ieByDest?.[dest] || defaultIE(dest)
    return { ...s, ieByDest: { ...s.ieByDest, [dest]: updater(cur) } }
  })
  const toggleIE = (dest, key, item) => setIE(dest, (cur) => ({ ...cur, [key]: cur[key].includes(item) ? cur[key].filter((x) => x !== item) : [...cur[key], item] }))
  const addCustomIE = (dest, key, text) => setIE(dest, (cur) => (cur[key].includes(text) ? cur : { ...cur, [key]: [...cur[key], text] }))
  const [oi, setOi] = useState(0)                       // active option index
  const upd = (patch) => setQ((s) => ({ ...s, ...patch }))

  const opt = q.options[oi] || q.options[0]
  const setOpt = (patch) => setQ((s) => ({ ...s, options: s.options.map((o, x) => (x === oi ? { ...o, ...patch } : o)) }))

  /* ---------- multi-destination sectors ---------- */
  const setSectors = (sectors) => {
    const nights = Math.max(1, sectors.reduce((s, x) => s + Math.max(0, num(x.nights)), 0))
    const days = nights + 1
    const destShort = sectors.find((s) => s.destination)?.destination || ''
    const destination = sectors.map((s) => s.destination).filter(Boolean).join(', ')
    setQ((s) => ({
      ...s, sectors, nights, days, destShort, destination,
      // drop any night/day selections that fall outside the new range
      options: s.options.map((o) => ({
        ...o,
        stays: o.stays.map((st) => ({ ...st, nights: st.nights.filter((n) => n <= nights) })),
        services: o.services.map((sv) => ({ ...sv, days: sv.days.filter((d) => d <= days) })),
      })),
    }))
  }
  const addSector = () => setSectors([...q.sectors, { id: uid(), destination: '', nights: 1 }])
  const setSector = (i, patch) => setSectors(q.sectors.map((s, x) => (x === i ? { ...s, ...patch } : s)))
  const rmSector = (i) => { if (q.sectors.length <= 1) return; setSectors(q.sectors.filter((_, x) => x !== i)) }
  const multiDest = q.sectors.length > 1
  // distinct destinations in this trip — inclusions/exclusions are kept per destination
  const ieDests = [...new Set(q.sectors.map((s) => s.destination).filter(Boolean))]

  const nightList = Array.from({ length: q.nights }, (_, i) => i + 1)
  const dayList = Array.from({ length: q.days }, (_, i) => i + 1)
  const nightCity = (n) => cityForNight(q.sectors, n)
  const dayCity = (d) => cityForNight(q.sectors, Math.min(d, q.nights))

  /* ---------- option ops ---------- */
  // options differ by HOTELS in most cases — a new option carries over the
  // day-wise services, flights, extras & cab setup and only the stays start blank
  const cloneExceptStays = (src, name) => ({
    ...blankOption(name),
    sameCab: src?.sameCab || false, sameCabId: src?.sameCabId || '', sameCabName: src?.sameCabName || '',
    services: (src?.services || []).map((x) => ({ ...x, id: uid() })),
    flights: (src?.flights || []).map((x) => ({ ...x, id: uid() })),
    extras: (src?.extras || []).map((x) => ({ ...x, id: uid() })),
  })
  const addOption = () => setQ((s) => {
    const star = STARS[Math.min(s.options.length, STARS.length - 1)]
    return { ...s, options: [...s.options, cloneExceptStays(s.options[oi] || s.options[0], star)] }
  })
  const dupOption = () => setQ((s) => {
    const clone = { ...s.options[oi], id: uid(), stays: s.options[oi].stays.map((x) => ({ ...x, id: uid() })), services: s.options[oi].services.map((x) => ({ ...x, id: uid() })), flights: s.options[oi].flights.map((x) => ({ ...x, id: uid() })), extras: s.options[oi].extras.map((x) => ({ ...x, id: uid() })) }
    return { ...s, options: [...s.options.slice(0, oi + 1), clone, ...s.options.slice(oi + 1)] }
  })
  const rmOption = () => { if (q.options.length <= 1) return; setQ((s) => ({ ...s, options: s.options.filter((_, x) => x !== oi) })); setOi(Math.max(0, oi - 1)) }

  /* ---------- manage-options modal ---------- */
  const [optModal, setOptModal] = useState(false)
  const [optDraft, setOptDraft] = useState([])
  const openOptModal = () => { setOptDraft(q.options.map((o) => ({ id: o.id, name: o.name }))); setOptModal(true) }
  const draftSet = (i, name) => setOptDraft((d) => d.map((x, ix) => (ix === i ? { ...x, name } : x)))
  const draftAdd = () => setOptDraft((d) => [...d, { id: uid(), name: STARS[Math.min(d.length, STARS.length - 1)] }])
  const draftRm = (i) => setOptDraft((d) => (d.length > 1 ? d.filter((_, ix) => ix !== i) : d))
  const saveOpts = () => {
    const newOptions = optDraft.map((d) => {
      const existing = q.options.find((o) => o.id === d.id)
      return existing ? { ...existing, name: d.name || existing.name } : { ...cloneExceptStays(q.options[oi] || q.options[0], d.name || 'Option'), id: d.id }
    })
    setQ((s) => ({ ...s, options: newOptions }))
    setOi((cur) => Math.min(cur, newOptions.length - 1))
    setOptModal(false)
  }

  /* ---------- copy-to-option modal ---------- */
  const [copyModal, setCopyModal] = useState(false)
  const [copyState, setCopyState] = useState(null)
  const openCopyModal = () => { setCopyState({ target: '__new__', mode: 'hotels', mealPlan: 'CP', replacements: {} }); setCopyModal(true) }
  const applyCopy = () => {
    const src = opt
    const copyStays = src.stays.map((st) => {
      let ns = { ...st, id: uid(), nights: [...st.nights] }
      if (copyState.mode === 'hotels') {
        const rep = copyState.replacements[st.id]
        if (rep) ns = { ...ns, hotelId: rep.id, hotelName: rep.name, hotelCity: rep.city, hotelStar: rep.rating, rate: rep.buyingPrice ? String(rep.buyingPrice) : ns.rate, given: rep.buyingPrice ? String(rep.buyingPrice) : ns.given, roomType: rep.roomTypes?.split(',')[0]?.trim() || ns.roomType, awebRate: rep.extraBedAdult || 0, cwebRate: rep.extraBedChild || 0, cnbRate: rep.childNoBed || 0 }
      } else if (copyState.mode === 'meal') {
        ns = { ...ns, mealPlan: copyState.mealPlan }
      }
      return ns
    })
    const copied = {
      stays: copyStays,
      services: src.services.map((s) => ({ ...s, id: uid(), days: [...s.days] })),
      flights: src.flights.map((f) => ({ ...f, id: uid() })),
      extras: src.extras.map((e) => ({ ...e, id: uid() })),
      sameCab: src.sameCab, sameCabId: src.sameCabId, sameCabName: src.sameCabName, sellingOverride: '',
    }
    const isNew = copyState.target === '__new__'
    const targetIdx = isNew ? q.options.length : q.options.findIndex((o) => o.id === copyState.target)
    setQ((s) => {
      if (isNew) return { ...s, options: [...s.options, { ...blankOption(STARS[Math.min(s.options.length, STARS.length - 1)]), ...copied }] }
      return { ...s, options: s.options.map((o, ix) => (ix === targetIdx ? { ...o, ...copied } : o)) }
    })
    setOi(targetIdx)
    setCopyModal(false)
    toast(isNew ? 'Copied into a new option' : 'Copied into the selected option')
  }
  const otherOpts = q.options.map((o, ix) => ({ o, ix })).filter((x) => x.ix !== oi)
  const targetLabels = ['+ New option', ...otherOpts.map(({ o, ix }) => `Option ${ix + 1}: ${o.name}`)]
  const targetValue = copyState?.target === '__new__' ? '+ New option' : (() => { const f = q.options.findIndex((o) => o.id === copyState?.target); return f >= 0 ? `Option ${f + 1}: ${q.options[f].name}` : '+ New option' })()
  const pickTarget = (label) => {
    if (label === '+ New option') return setCopyState((c) => ({ ...c, target: '__new__' }))
    const m = otherOpts.find(({ o, ix }) => `Option ${ix + 1}: ${o.name}` === label)
    setCopyState((c) => ({ ...c, target: m ? m.o.id : '__new__' }))
  }

  /* ---------- hotels ---------- */
  const addStay = () => setOpt({ stays: [...opt.stays, blankStay(q, opt)] })
  const dupStay = (i) => setOpt({ stays: [...opt.stays.slice(0, i + 1), { ...opt.stays[i], id: uid(), nights: [] }, ...opt.stays.slice(i + 1)] })
  const rmStay = (i) => setOpt({ stays: opt.stays.filter((_, x) => x !== i) })
  const setStay = (i, patch) => setOpt({ stays: opt.stays.map((s, x) => (x === i ? { ...s, ...patch } : s)) })

  /* ---------- transports & activities ---------- */
  const addService = (kind) => setOpt({ services: [...opt.services, blankService(kind, opt, q)] })
  const dupService = (i) => setOpt({ services: [...opt.services.slice(0, i + 1), { ...opt.services[i], id: uid(), days: [] }, ...opt.services.slice(i + 1)] })
  const rmService = (i) => setOpt({ services: opt.services.filter((_, x) => x !== i) })
  const setService = (i, patch) => setOpt({ services: opt.services.map((s, x) => (x === i ? { ...s, ...patch } : s)) })

  /* ---------- attach a pre-built Day Itinerary (fills a day fast) ---------- */
  const dayTemplates = templates || []
  const [dayTplModal, setDayTplModal] = useState(false)
  const [dayTpl, setDayTpl] = useState({ id: '', day: 1 })
  const openDayTpl = () => { setDayTpl({ id: dayTemplates[0]?.id || '', day: 1 }); setDayTplModal(true) }
  const attachDayTpl = () => {
    const tpl = dayTemplates.find((t) => t.id === dayTpl.id)
    if (!tpl) return toast('Pick a day itinerary')
    const day = Math.min(Math.max(1, num(dayTpl.day)), q.days)
    const svcs = (tpl.services || []).map((s) => ({
      id: uid(), kind: s.kind === 'activity' ? 'activity' : 'transport', days: [day],
      location: s.location || '', serviceType: s.serviceType || '', description: s.description || '',
      durationMins: s.durationMins ? String(s.durationMins) : '', qty: num(s.qty) || (s.kind === 'activity' ? (num(q.adults) || 1) : 1),
      cabId: s.cabId || '', cabName: s.cabName || '', image: s.image || '',
      rate: s.rate != null ? String(s.rate) : '', given: s.given != null ? String(s.given) : '',
    }))
    if (!svcs.length) return toast('That day itinerary has no services yet')
    setOpt({ services: [...opt.services, ...svcs] })
    setDayTplModal(false)
    toast(`Added ${svcs.length} service${svcs.length > 1 ? 's' : ''} from “${tpl.name}”`)
  }

  /* ---------- flights ---------- */
  const addFlight = (kind) => setOpt({ flights: [...opt.flights, blankFlight(kind)] })
  const rmFlight = (i) => setOpt({ flights: opt.flights.filter((_, x) => x !== i) })
  const setFlight = (i, patch) => setOpt({ flights: opt.flights.map((f, x) => (x === i ? { ...f, ...patch } : f)) })

  /* ---------- extras ---------- */
  const addExtra = () => setOpt({ extras: [...opt.extras, { id: uid(), name: '', note: '', cost: '', sell: '' }] })
  const rmExtra = (i) => setOpt({ extras: opt.extras.filter((_, x) => x !== i) })
  const setExtra = (i, patch) => setOpt({ extras: opt.extras.map((e, x) => (x === i ? { ...e, ...patch } : e)) })

  /* ---------- live totals for the active option ---------- */
  const t = useMemo(() => optionTotals(opt, q), [opt, q.markupMode, q.markupValue, q.taxOn, q.taxEnabled, q.taxPercent, q.roundTo])

  /* ---------- save ----------
     A quote can always be saved — partial data just stays a Draft. Once every
     core section is filled (guest, date, destination, hotels covering the
     nights, a real price) serialize() flags it "Quoted" (ready to share/book).
     Editing a package that's already past the quote stage keeps its status. */
  const save = async () => {
    try {
      const rec = serialize(q, oi, t, destinations, inclusionPresets)
      if (editing && LOCKED_STATUSES.includes(editing.status)) rec.status = editing.status
      const isDraft = rec.status === 'Draft'
      let id
      if (editing) { await updatePackage(editing.id, rec); id = editing.id }
      else { id = (await addPackage(rec)).id }
      toast(isDraft ? 'Saved as draft — fill the rest to finish the quote' : (editing ? 'Quote updated' : 'Quote created'))
      nav(`/app/packages/${id}/share`)
    } catch (ex) { console.error('Quote save failed', ex); toast(ex.message || 'Could not save the quote') }
  }

  return (
    <div className="qb">
      {/* Top bar */}
      <div className="qb-topbar">
        <button className="qb-back" onClick={() => nav(-1)}><Icon name="chevron" size={15} className="qb-back-ic" /> Back</button>
        <div className="qb-crumb">
          <span>{q.clientName || 'New quote'}</span>
          <span className="qb-crumb-sep">·</span>
          <span>{q.destination || q.destShort || 'Destination'}</span>
          <span className="qb-crumb-sep">·</span>
          <span>{q.nights}N / {q.days}D</span>
        </div>
        {canSeePricing && (
          <div className="qb-topbar-total">
            <span className="qb-tt-k">Total</span>
            <span className="qb-tt-v">{inr(t.grandTotal)}</span>
          </div>
        )}
        <Button onClick={save}>{editing ? 'Update Quote' : 'Save Quote'}</Button>
      </div>

      <div className="qb-body">
        {/* Trip basics */}
        <div className="qb-basic">
          <div>
            <div className="qb-basic-title">Trip basics</div>
            <div className="qb-basic-sub">Add one or more destinations with their nights — the totals drive every chip below.</div>
          </div>
          <div className="qb-basic-grid five">
            <Field label="Client"><Input value={q.clientName} onChange={(e) => upd({ clientName: e.target.value })} placeholder="Guest name" /></Field>
            <Field label="Start date"><DatePicker value={q.startDate} onChange={(v) => upd({ startDate: v })} placeholder="Pick date" /></Field>
            <Field label="Adults"><Input type="number" min="1" value={q.adults} onChange={(e) => upd({ adults: e.target.value })} /></Field>
            <Field label="Children" hint="2–12 yrs"><Input type="number" min="0" value={q.children} onChange={(e) => upd({ children: e.target.value })} /></Field>
            <Field label="Rooms"><Input type="number" min="1" value={q.rooms} onChange={(e) => upd({ rooms: e.target.value })} /></Field>
          </div>

          {/* Destinations & nights (multi-destination sectors) */}
          <div className="qb-sectors">
            <div className="qb-sectors-head">
              <span className="qb-label">Destinations &amp; nights</span>
              <span className="qb-sectors-total">{q.nights} nights · {q.days} days{multiDest ? ` · ${q.sectors.length} stops` : ''}</span>
            </div>
            {q.sectors.map((sec, i) => (
              <div className="qb-sector-row" key={sec.id}>
                <span className="qb-sector-seq">{i + 1}</span>
                <div className="qb-sector-dest">
                  <PillSelect value={sec.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
                    onChange={(v) => setSector(i, { destination: v === 'Select destination' ? '' : v })} />
                </div>
                <div className="qb-sector-nights">
                  <button className="qb-step" onClick={() => setSector(i, { nights: Math.max(1, num(sec.nights) - 1) })} aria-label="Fewer nights">−</button>
                  <input type="number" min="1" value={sec.nights} onChange={(e) => setSector(i, { nights: e.target.value })} />
                  <span className="qb-sector-n">N</span>
                  <button className="qb-step" onClick={() => setSector(i, { nights: num(sec.nights) + 1 })} aria-label="More nights">+</button>
                </div>
                {q.sectors.length > 1 && <button className="qb-act danger qb-sector-rm" onClick={() => rmSector(i)}><Icon name="trash" size={14} /></button>}
              </div>
            ))}
            <button className="qb-sector-add" onClick={addSector}><Icon name="plus" size={14} /> Add destination</button>
          </div>
        </div>

        {/* Package option tabs */}
        <div className="qb-options">
          <div className="qb-opt-tabs">
            <span className="qb-opt-lead">Package Types / Options · {q.options.length}</span>
            {q.options.map((o, i) => (
              <button key={o.id} className={`qb-opt-tab ${i === oi ? 'on' : ''}`} onClick={() => setOi(i)}>
                Option {i + 1}<span className="qb-opt-tab-star">{o.name}</span>
              </button>
            ))}
            <button className="qb-opt-add" onClick={addOption}><Icon name="plus" size={14} /> Add option</button>
            <button className="qb-opt-edit" onClick={openOptModal}><Icon name="settings" size={14} /> Manage</button>
          </div>
          <div className="qb-opt-toolbar">
            <div className="qb-opt-star">
              <span className="qb-mini-k">Editing</span>
              <strong className="qb-opt-current">Option {oi + 1}: {opt.name}</strong>
            </div>
            <div className="qb-opt-acts">
              <button className="qb-act" onClick={openCopyModal}><Icon name="copy" size={14} /> Copy…</button>
              <button className="qb-act" onClick={dupOption}><Icon name="copy" size={14} /> Duplicate</button>
              {q.options.length > 1 && <button className="qb-act danger" onClick={rmOption}><Icon name="trash" size={14} /> Remove</button>}
            </div>
          </div>
        </div>

        {/* ---------------- Hotels ---------------- */}
        <Section icon="hotels" title="Hotels" desc="Add hotel details with the services provided and the selling cost price. Tip: use Duplicate to add multiple hotels quickly."
          total={t.hotelCost} onAdd={addStay} addLabel="Add hotel">
          {opt.stays.length === 0 && <Empty text="No hotels yet — add one to cover the nights." />}
          {opt.stays.map((st, i) => (
            <ItemCard key={st.id} onDup={() => dupStay(i)} onRemove={() => rmStay(i)}>
              <div className="qb-fields">
                <div className="qb-field-block">
                  <label className="qb-label">Stay nights</label>
                  <ChipRow items={nightList} selected={st.nights} onToggle={(n) => setStay(i, { nights: toggle(st.nights, n) })}
                    label={(n) => ({ top: `${ORD(n)} N`, sub: multiDest ? nightCity(n) : chipDate(q.startDate, n - 1), title: [nightCity(n), chipDate(q.startDate, n - 1)].filter(Boolean).join(' · ') })} />
                </div>
                <div className="qb-grid-3">
                  <Field label="Hotel">
                    <HotelPicker value={{ id: st.hotelId, name: st.hotelName, city: st.hotelCity, star: st.hotelStar }} hotels={hotels}
                      destFilter={st.nights.length ? [...new Set(st.nights.map(nightCity).filter(Boolean))] : ieDests}
                      onPick={(h) => setStay(i, { hotelId: h.id, hotelName: h.name, hotelCity: h.city || h.destination || '', hotelStar: h.rating, hotelImage: h.image || '', hotelDescription: h.description || '', roomType: h.roomTypes?.split(',')[0]?.trim() || st.roomType, rate: h.buyingPrice ? String(h.buyingPrice) : st.rate, given: st.given || (h.buyingPrice ? String(h.buyingPrice) : st.given), awebRate: h.extraBedAdult || 0, cwebRate: h.extraBedChild || 0, cnbRate: h.childNoBed || 0 })} />
                  </Field>
                  <Field label="Room type"><PillSelect value={st.roomType} options={hotelRooms(hotels, st.hotelId)} onChange={(v) => setStay(i, { roomType: v })} /></Field>
                  <Field label="Meal plan"><PillSelect value={st.mealPlan} options={MEAL_PLANS} onChange={(v) => setStay(i, { mealPlan: v })} format={(v) => MEAL_LABEL[v] || v} /></Field>
                </div>
                <div className="qb-grid-4">
                  <Field label="Pax / room" hint="WoEB"><Input type="number" min="1" value={st.paxPerRoom} onChange={(e) => setStay(i, { paxPerRoom: e.target.value })} /></Field>
                  <Field label="No. of rooms"><Input type="number" min="1" value={st.rooms} onChange={(e) => setStay(i, { rooms: e.target.value })} /></Field>
                  {canSeePricing && <Field label="Rate / night (₹)" hint="cost"><Input type="number" value={st.rate} onChange={(e) => setStay(i, { rate: e.target.value })} placeholder="0" /></Field>}
                  {canSeePricing && <Field label="Given / night (₹)" hint="selling"><Input type="number" value={st.given} onChange={(e) => setStay(i, { given: e.target.value })} placeholder="0" /></Field>}
                </div>
                <div className="qb-grid-4">
                  <Field label="AWEB" hint={num(st.awebRate) ? `+${inr(st.awebRate)}/bed` : 'adult extra bed'}><Input type="number" min="0" value={st.aweb} onChange={(e) => setStay(i, { aweb: e.target.value })} /></Field>
                  <Field label="CWEB" hint={num(st.cwebRate) ? `+${inr(st.cwebRate)}/bed` : 'child extra bed'}><Input type="number" min="0" value={st.cweb} onChange={(e) => setStay(i, { cweb: e.target.value })} /></Field>
                  <Field label="CNB" hint={num(st.cnbRate) ? `+${inr(st.cnbRate)}/child` : 'child no bed'}><Input type="number" min="0" value={st.cnb} onChange={(e) => setStay(i, { cnb: e.target.value })} /></Field>
                  <Field label="Comp child"><PillSelect value={st.compChild} options={COMP_CHILD} onChange={(v) => setStay(i, { compChild: v })} /></Field>
                </div>
              </div>
              <PricePanel
                title="Prices"
                rows={st.nights.map((n) => ({ label: chipDate(q.startDate, n - 1) || `Night ${n}`, sub: bedPerNight(st) ? `room + extra beds` : `Night ${n}`, rate: num(st.rate) * num(st.rooms) + bedPerNight(st), val: num(st.given) * num(st.rooms) + bedPerNight(st) }))}
                cost={stayCost(st)}
                sell={staySell(st)}
                emptyHint="Select nights to price this stay"
              />
            </ItemCard>
          ))}
        </Section>

        {/* ---------------- Transports & Activities ---------------- */}
        <Section icon="cabs" title="Transports & Activities" desc="Add transportation and activity/ticket services with the selling cost price for each. Tip: use Duplicate to repeat a service."
          total={t.transportCost + t.activityCost}
          toolbar={
            <label className="qb-toggle-line">
              <input type="checkbox" checked={opt.sameCab} onChange={(e) => setOpt({ sameCab: e.target.checked })} />
              <span className="qb-check-box"><Icon name="check" size={12} strokeWidth={2.6} /></span>
              <span>Same cab type for all</span>
              {opt.sameCab && (
                <span className="qb-toggle-select">
                  <PillSelect value={opt.sameCabName || 'Select cab'} options={['Select cab', ...cabs.map((c) => c.name)]} onChange={(v) => { const c = cabs.find((x) => x.name === v); setOpt({ sameCabName: v === 'Select cab' ? '' : v, sameCabId: c?.id || '' }) }} />
                </span>
              )}
            </label>
          }
          actions={<>
            {dayTemplates.length > 0 && <Button size="sm" variant="tertiary" onClick={openDayTpl}><Icon name="calendar" size={14} /> From saved day</Button>}
            <Button size="sm" variant="secondary" onClick={() => addService('transport')}><Icon name="plus" size={14} /> Transport service</Button>
            <Button size="sm" variant="secondary" onClick={() => addService('activity')}><Icon name="plus" size={14} /> Activity / ticket</Button>
          </>}>
          {opt.services.length === 0 && <Empty text="No transport or activities yet — add pickups, sightseeing or tickets." />}
          {opt.services.map((s, i) => (
            <ItemCard key={s.id} onDup={() => dupService(i)} onRemove={() => rmService(i)} tag={s.kind === 'activity' ? 'Activity / Ticket' : 'Transport'} tagTone={s.kind === 'activity' ? 'activity' : 'transport'}>
              <div className="qb-fields">
                <div className="qb-field-block">
                  <label className="qb-label">Applies on <span className="qb-opt">tap a day to add or remove</span></label>
                  <ChipRow items={dayList} selected={s.days} onToggle={(d) => setService(i, { days: toggle(s.days, d) })}
                    label={(d) => ({ top: `${ORD(d)} Day`, sub: multiDest ? dayCity(d) : chipDate(q.startDate, d - 1), title: [dayCity(d), chipDate(q.startDate, d - 1)].filter(Boolean).join(' · ') })} />
                </div>
                <div className="qb-grid-2">
                  {s.kind === 'transport' ? (
                    <Field label="Transport">
                      <MasterPicker value={s.location} items={serviceLocations} placeholder="Select or search a route…"
                        destFilter={s.days.length ? [...new Set(s.days.map(dayCity).filter(Boolean))] : ieDests}
                        sub={(it) => `${it.serviceType}${it.durationMins ? ` · ${it.durationMins} mins` : ''}${it.sell != null ? ` · ${inr(it.sell)}` : ''}`}
                        onPick={(it) => setService(i, { location: it.name, ...(it.custom ? {} : { serviceType: it.serviceType || s.serviceType, description: it.description || s.description, image: it.image || '', durationMins: it.durationMins ? String(it.durationMins) : s.durationMins, rate: it.cost != null ? String(it.cost) : s.rate, given: it.sell != null ? String(it.sell) : s.given }) })} />
                    </Field>
                  ) : (
                    <Field label="Activity / ticket name">
                      <MasterPicker value={s.location} items={activities} placeholder="Select or search an activity…"
                        destFilter={s.days.length ? [...new Set(s.days.map(dayCity).filter(Boolean))] : ieDests}
                        sub={(it) => `${it.category}${it.sell != null ? ` · ${inr(it.sell)}` : ''}`}
                        onPick={(it) => setService(i, { location: it.name, ...(it.custom ? {} : { serviceType: it.category || s.serviceType, description: it.description || s.description, image: it.image || '', durationMins: it.durationMins ? String(it.durationMins) : s.durationMins, rate: it.cost != null ? String(it.cost) : s.rate, given: it.sell != null ? String(it.sell) : s.given }) })} />
                    </Field>
                  )}
                  {s.kind === 'transport'
                    ? <Field label="Service type"><PillSelect value={s.serviceType || 'Select'} options={['Select', ...SERVICE_TYPES]} onChange={(v) => setService(i, { serviceType: v === 'Select' ? '' : v })} /></Field>
                    : <Field label="Category"><PillSelect value={s.serviceType || 'Select'} options={['Select', ...activityCats]} onChange={(v) => setService(i, { serviceType: v === 'Select' ? '' : v })} /></Field>}
                </div>
                <div className="qb-grid-3">
                  <Field label="Duration (mins)"><Input type="number" value={s.durationMins} onChange={(e) => setService(i, { durationMins: e.target.value })} placeholder="Optional" /></Field>
                  <Field label={s.kind === 'activity' ? 'Qty (pax)' : 'Vehicles'}><Input type="number" min="1" value={s.qty} onChange={(e) => setService(i, { qty: e.target.value })} /></Field>
                  {s.kind === 'transport' && !opt.sameCab
                    ? <Field label="Cab type"><PillSelect value={s.cabName || 'Select'} options={['Select', ...cabs.map((c) => c.name)]} onChange={(v) => {
                        const c = cabs.find((x) => x.name === v)
                        // picking a cab pulls its per-day rate from Master Data (only fills empty fields)
                        setService(i, { cabName: v === 'Select' ? '' : v, cabId: c?.id || '', rate: s.rate || (c?.ratePerDay ? String(c.ratePerDay) : s.rate), given: s.given || (c?.ratePerDay ? String(c.ratePerDay) : s.given) })
                      }} /></Field>
                    : <Field label={' '}><div className="qb-inline-note">{s.kind === 'transport' ? (opt.sameCabName || 'Set cab above') : 'per person / ticket'}</div></Field>}
                </div>
                {canSeePricing && (
                  <div className="qb-grid-2">
                    <Field label="Rate (₹)" hint="cost per day / unit"><Input type="number" value={s.rate} onChange={(e) => setService(i, { rate: e.target.value })} placeholder="0" /></Field>
                    <Field label="Given (₹)" hint="selling per day / unit"><Input type="number" value={s.given} onChange={(e) => setService(i, { given: e.target.value })} placeholder="0" /></Field>
                  </div>
                )}
                <Field label="Description" full>
                  <textarea className="control" rows={2} value={s.description || ''} onChange={(e) => setService(i, { description: e.target.value })}
                    placeholder={s.kind === 'activity' ? 'What the guest will do / see — shown on the quote & WhatsApp' : 'Notes about this transfer — shown on the quote & WhatsApp'} />
                </Field>
              </div>
              <PricePanel
                title={s.kind === 'activity' ? 'Activity prices' : 'Transport prices'}
                rows={s.days.map((d) => ({ label: chipDate(q.startDate, d - 1) || `Day ${d}`, sub: `${num(s.given)} × ${num(s.qty) || 1}`, rate: num(s.rate) * (num(s.qty) || 1), val: num(s.given) * (num(s.qty) || 1) }))}
                cost={num(s.rate) * (num(s.qty) || 1) * Math.max(1, s.days.length)}
                sell={num(s.given) * (num(s.qty) || 1) * Math.max(1, s.days.length)}
                emptyHint="Select days to price this service"
              />
            </ItemCard>
          ))}
        </Section>

        {/* ---------------- Flight Details ---------------- */}
        <Section icon="plane" title="Flight Details" desc="Provide flight details for this quote if included."
          total={t.flightCost}
          actions={<>
            <Button size="sm" variant="tertiary" onClick={() => toast('Flight API integration coming soon — add manually for now')}>Add via API</Button>
            <Button size="sm" variant="secondary" onClick={() => addFlight('Round trip')}><Icon name="plus" size={14} /> Round trip</Button>
            <Button size="sm" variant="secondary" onClick={() => addFlight('One way')}><Icon name="plus" size={14} /> One way</Button>
            {opt.flights.length > 0 && <Button size="sm" variant="secondary" onClick={() => addFlight('One way')}><Icon name="plus" size={14} /> Add more flight</Button>}
          </>}>
          {opt.flights.length === 0 && <Empty text="No flights added. Flights cost / selling total: N/A" />}
          {opt.flights.map((f, i) => (
            <FlightCard key={f.id} f={f} adults={num(q.adults)} childs={num(q.children)} infants={num(q.infants)}
              onTravellers={(patch) => upd(patch)} onChange={(patch) => setFlight(i, patch)} onRemove={() => rmFlight(i)} />
          ))}
        </Section>

        {/* ---------------- Special services ---------------- */}
        <Section icon="star" title="Any other special service" desc="Add extra services like off-road dinner, side trekking etc. that go with the overall trip."
          total={t.extraCost} onAdd={addExtra} addLabel="Add service">
          {opt.extras.length === 0 && <Empty text="No special services." />}
          {opt.extras.map((e, i) => (
            <ItemCard key={e.id} onRemove={() => rmExtra(i)}>
              <div className="qb-fields">
                <div className="qb-grid-2">
                  <Field label="Service"><Input value={e.name} onChange={(ev) => setExtra(i, { name: ev.target.value })} placeholder="e.g. Candle-light dinner" /></Field>
                  <Field label="Note / date"><Input value={e.note} onChange={(ev) => setExtra(i, { note: ev.target.value })} placeholder="optional" /></Field>
                </div>
                {canSeePricing && (
                  <div className="qb-grid-2">
                    <Field label="Cost (₹)"><Input type="number" value={e.cost} onChange={(ev) => setExtra(i, { cost: ev.target.value })} placeholder="0" /></Field>
                    <Field label="Given (₹)"><Input type="number" value={e.sell} onChange={(ev) => setExtra(i, { sell: ev.target.value })} placeholder="0" /></Field>
                  </div>
                )}
              </div>
              <PricePanel title="Service price" rows={[{ label: e.name || 'Service', sub: e.note, rate: num(e.cost), val: num(e.sell) }]} cost={num(e.cost)} sell={num(e.sell)} />
            </ItemCard>
          ))}
        </Section>

        {/* ---------------- Inclusions & Exclusions (per destination) ---------------- */}
        <section className="qb-section">
          <div className="qb-section-head">
            <span className="qb-section-ic"><Icon name="check" size={18} /></span>
            <div className="qb-section-meta">
              <div className="qb-section-title">Inclusions &amp; Exclusions</div>
              <div className="qb-section-desc">Set what's included &amp; excluded <strong>for each destination</strong> — every stop keeps its own list, and they print on the PDF, email &amp; WhatsApp.</div>
            </div>
          </div>
          <div className="qb-section-body">
            {(ieDests.length ? ieDests : ['']).map((dest) => {
              const ie = ieFor(dest)
              const dm = presetsFor(dest)   // this destination's own master presets
              return (
                <div className="qb-ie-dest" key={dest || '__trip'}>
                  <div className="qb-ie-dest-head">
                    <span className="qb-ie-dest-name"><Icon name="destinations" size={14} /> {dest || 'This trip'}</span>
                    <span className="qb-ie-dest-count">{ie.inclusions.length} inclusions · {ie.exclusions.length} exclusions</span>
                  </div>
                  <div className="qb-ie-grid">
                    <IEList title="Inclusions" tone="inc" master={dm.inclusions} selected={ie.inclusions}
                      onToggle={(x) => toggleIE(dest, 'inclusions', x)} onAddCustom={(t) => addCustomIE(dest, 'inclusions', t)} />
                    <IEList title="Exclusions" tone="exc" master={dm.exclusions} selected={ie.exclusions}
                      onToggle={(x) => toggleIE(dest, 'exclusions', x)} onAddCustom={(t) => addCustomIE(dest, 'exclusions', t)} />
                  </div>
                </div>
              )
            })}
            <p className="qb-ie-note">Each destination has its own list. Manage the master presets under <strong>Master Data → Inclusions &amp; Exclusions</strong>.</p>
          </div>
        </section>

        {/* ---------------- Summary ---------------- */}
        <div className="qb-summary">
          <div className="qb-summary-head">
            <div className="qb-section-title">Summary</div>
            <div className="qb-section-desc">Review the quote before saving.</div>
          </div>
          <div className="qb-summary-meta">
            <div><span className="qb-sm-k">Start date</span><span className="qb-sm-v">{q.startDate ? offDate(q.startDate, 0, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
            <div><span className="qb-sm-k">Duration</span><span className="qb-sm-v">{q.nights} Nights, {q.days} Days</span></div>
            <div><span className="qb-sm-k">Pax</span><span className="qb-sm-v">{num(q.adults)} Adults{num(q.children) ? ` · ${num(q.children)} Children` : ''}{num(q.infants) ? ` · ${num(q.infants)} Infants` : ''}</span></div>
          </div>

          {/* Cost breakdown per option — hidden for roles without pricing access */}
          {canSeePricing && (<>
          <div className="qb-cost-grid">
            {q.options.map((o, i) => {
              const ot = optionTotals(o, q)
              const act = ot.activityCost + ot.extraCost
              return (
                <div key={o.id} className={`qb-cost-card ${i === oi ? 'on' : ''}`} onClick={() => setOi(i)}>
                  <div className="qb-cost-name">Option {i + 1}: {o.name}</div>
                  <div className="qb-cost-total"><span className="qb-cost-k">Total cost</span><span className="qb-cost-v">{inr(ot.costPrice)}</span></div>
                  <div className="qb-cost-breakup">
                    <span><b>{inr(ot.hotelCost)}</b> Hotels</span><i>+</i>
                    <span><b>{inr(ot.transportCost)}</b> Transports</span><i>+</i>
                    <span><b>{inr(act)}</b> Activities / Tickets</span>
                    {ot.flightCost > 0 && <><i>+</i><span><b>{inr(ot.flightCost)}</b> Flights</span></>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="qb-cost-note">This is the total <strong>cost price</strong> for all provided services — <strong>not</strong> the selling price.</div>

          {/* Markup, Tax & Rounding */}
          <div className="qb-markup">
            <div className="qb-markup-title">Markup, Tax &amp; Rounding</div>
            <div className="qb-markup-controls">
              <Field label="Markup">
                <div className="qb-markup-pair">
                  <PillSelect value={q.markupMode === 'flat' ? 'Flat ₹' : 'Percentage'} options={['Percentage', 'Flat ₹']} onChange={(v) => upd({ markupMode: v === 'Flat ₹' ? 'flat' : 'percent' })} />
                  <div className="qb-unit-input"><input type="number" min="0" value={q.markupValue} onChange={(e) => upd({ markupValue: e.target.value })} /><span>{q.markupMode === 'percent' ? '%' : '₹'}</span></div>
                </div>
              </Field>
              <Field label="Tax applied on"><PillSelect value={q.taxOn === 'cost_markup' ? 'Cost + Markup' : 'Cost only'} options={['Cost only', 'Cost + Markup']} onChange={(v) => upd({ taxOn: v === 'Cost + Markup' ? 'cost_markup' : 'cost' })} /></Field>
              <Field label="Tax">
                <div className="qb-tax-pair">
                  <label className="qb-toggle-line"><input type="checkbox" checked={q.taxEnabled} onChange={(e) => upd({ taxEnabled: e.target.checked })} /><span className="qb-check-box"><Icon name="check" size={12} strokeWidth={2.6} /></span></label>
                  <div className="qb-unit-input"><input type="number" min="0" value={q.taxPercent} disabled={!q.taxEnabled} onChange={(e) => upd({ taxPercent: e.target.value })} /><span>%</span></div>
                </div>
              </Field>
              <Field label="Round to"><PillSelect value={q.roundTo ? `Nearest ${q.roundTo}` : 'No rounding'} options={['No rounding', 'Nearest 100', 'Nearest 500', 'Nearest 1000']} onChange={(v) => upd({ roundTo: v === 'No rounding' ? 0 : Number(v.replace('Nearest ', '')) })} /></Field>
            </div>

            <div className="qb-sell-table">
              <div className="qb-sell-row head"><span>Option</span><span>Cost</span><span>Markup</span><span>Tax</span><span>Selling</span><span>Profit</span></div>
              {q.options.map((o, i) => {
                const ot = optionTotals(o, q)
                return (
                  <div key={o.id} className={`qb-sell-row ${i === oi ? 'on' : ''}`} onClick={() => setOi(i)}>
                    <span className="qb-sell-name">Opt {i + 1}: {o.name}</span>
                    <span>{inr(ot.costPrice)}</span>
                    <span className="qb-sell-markup">+{inr(ot.markup)}</span>
                    <span>{inr(ot.tax)}</span>
                    <span className="qb-sell-total">{inr(ot.grandTotal)}</span>
                    <span className="qb-sell-profit">{inr(ot.profit)}</span>
                  </div>
                )
              })}
            </div>
          </div>
          </>)}

          {/* Remarks */}
          <div className="qb-remarks">
            <div className="qb-remarks-col">
              <label className="qb-label">Internal notes on selling price <span className="qb-opt">optional</span></label>
              <textarea className="control" rows={2} value={q.comments} onChange={(e) => upd({ comments: e.target.value })} placeholder="Why this price, negotiation room, etc. — internal only" />
            </div>
            <div className="qb-remarks-col">
              <label className="qb-label">Remarks for agent / customer <span className="qb-opt">optional</span></label>
              <textarea className="control" rows={2} value={q.customerRemarks || ''} onChange={(e) => upd({ customerRemarks: e.target.value })} placeholder="Shown on the shared quote — inclusion notes, terms, etc." />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Package Options modal ---------- */}
      <Modal open={optModal} onClose={() => setOptModal(false)} title="Package Types / Options" width={520}
        footer={<><Button variant="tertiary" onClick={() => setOptModal(false)}>Cancel</Button><Button onClick={saveOpts}>Save</Button></>}>
        <div className="opt-modal">
          <div className="opt-modal-cols"><span className="opt-col-num">#</span><span>Name</span><span /></div>
          {optDraft.map((d, i) => (
            <div className="opt-modal-row" key={d.id}>
              <span className="opt-modal-seq">{i + 1}</span>
              <Input value={d.name} onChange={(e) => draftSet(i, e.target.value)} placeholder="e.g. 4 Star" />
              {optDraft.length > 1 && <button className="opt-modal-x" onClick={() => draftRm(i)} aria-label="Remove option"><Icon name="trash" size={14} /></button>}
            </div>
          ))}
          <button className="opt-modal-add" onClick={draftAdd}><Icon name="plus" size={14} /> Add More</button>
        </div>
      </Modal>

      {/* ---------- Copy to Option modal ---------- */}
      <Modal open={copyModal} onClose={() => setCopyModal(false)} title="Copy Hotels for another Option" width={660}
        footer={<><Button variant="tertiary" onClick={() => setCopyModal(false)}>Cancel</Button><Button onClick={applyCopy}>Copy</Button></>}>
        {copyState && (
          <div className="copy-modal">
            <div className="copy-src">Source Option: <strong>Option {oi + 1}: {opt.name}</strong></div>

            <div className="copy-target">
              <div>
                <div className="copy-label">Target Option</div>
                <div className="copy-hint">The option where you want to copy to.</div>
              </div>
              <div className="copy-target-select"><PillSelect value={targetValue} options={targetLabels} onChange={pickTarget} /></div>
            </div>

            <div className="copy-q">What would you like to change in Hotels for the target option?</div>
            <div className="copy-modes">
              {[['hotels', 'Hotels', 'Add replacement hotels to copy across'], ['meal', 'Meal Plan', 'Change the meal plan and copy'], ['custom', 'Custom change', 'Copy as-is; update occupancy / room type after']].map(([m, label, sub]) => (
                <label key={m} className={`copy-mode ${copyState.mode === m ? 'on' : ''}`}>
                  <input type="radio" checked={copyState.mode === m} onChange={() => setCopyState((c) => ({ ...c, mode: m }))} />
                  <span className="copy-mode-radio" />
                  <span className="copy-mode-body"><span className="copy-mode-title">{label}</span><span className="copy-mode-sub">{sub}</span></span>
                </label>
              ))}
            </div>

            {copyState.mode === 'hotels' && (
              <div className="copy-hotels">
                <div className="copy-hotels-cols"><span>Existing hotel</span><span>Replacement hotel</span></div>
                {opt.stays.length === 0 && <div className="qb-empty">No hotels in the source option.</div>}
                {opt.stays.map((st) => {
                  const rep = copyState.replacements[st.id]
                  return (
                    <div className="copy-hotel-row" key={st.id}>
                      <div className="copy-hotel-ex">
                        <div className="copy-hotel-name">{st.hotelName || 'No hotel selected'}</div>
                        <div className="copy-hotel-sub">{[st.hotelCity, st.hotelStar ? `${st.hotelStar} Star` : '', st.nights.length ? `${st.nights.join(', ')} N` : ''].filter(Boolean).join(' · ')}</div>
                      </div>
                      <HotelPicker value={rep ? { id: rep.id, name: rep.name, city: rep.city, star: rep.rating } : {}} hotels={hotels}
                        destFilter={st.nights.length ? [...new Set(st.nights.map(nightCity).filter(Boolean))] : ieDests}
                        placeholder="Type to search…" onPick={(h) => setCopyState((c) => ({ ...c, replacements: { ...c.replacements, [st.id]: h } }))} />
                    </div>
                  )
                })}
              </div>
            )}

            {copyState.mode === 'meal' && (
              <div className="copy-meal">
                <Field label="New meal plan for all hotels"><PillSelect value={copyState.mealPlan} options={MEAL_PLANS} format={(v) => MEAL_LABEL[v] || v} onChange={(v) => setCopyState((c) => ({ ...c, mealPlan: v }))} /></Field>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ---------- Attach a saved Day Itinerary ---------- */}
      <Modal open={dayTplModal} onClose={() => setDayTplModal(false)} title="Attach a saved day itinerary" width={560}
        footer={<><Button variant="tertiary" onClick={() => setDayTplModal(false)}>Cancel</Button><Button onClick={attachDayTpl}>Add to day</Button></>}>
        <div className="col gap-base">
          <p className="t-body-sm c-muted">Drop a pre-built day — its transfers &amp; activities are added to the day you pick. Manage these under <strong>Packages → Day Itineraries</strong>.</p>
          <Field label="Day itinerary">
            <PillSelect value={dayTemplates.find((t) => t.id === dayTpl.id)?.name || 'Select a day'}
              options={dayTemplates.map((t) => t.name)}
              onChange={(name) => setDayTpl((s) => ({ ...s, id: (dayTemplates.find((t) => t.name === name) || {}).id || '' }))} />
          </Field>
          <Field label="Apply to day">
            <PillSelect value={`Day ${dayTpl.day}`} options={dayList.map((d) => `Day ${d}`)} onChange={(v) => setDayTpl((s) => ({ ...s, day: Number(v.replace('Day ', '')) || 1 }))} />
          </Field>
          {(() => {
            const tpl = dayTemplates.find((t) => t.id === dayTpl.id)
            const svcs = tpl?.services || []
            return svcs.length ? (
              <div className="qb-price-panel">
                <div className="qb-pp-head">{svcs.length} service{svcs.length > 1 ? 's' : ''}{tpl.destination ? ` · ${tpl.destination}` : ''}</div>
                <div className="qb-pp-rows">
                  {svcs.map((s, i) => (
                    <div className="qb-pp-row" key={i}>
                      <div className="qb-pp-date">{s.location || s.serviceType}<span className="qb-pp-sub">{s.kind === 'activity' ? 'Activity' : 'Transport'}</span></div>
                      {canSeePricing && <div className="qb-pp-val">{inr(num(s.given))}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="t-body-sm c-muted">This day itinerary has no services yet.</p>
          })()}
        </div>
      </Modal>

      {/* Sticky pricing footer (active option) — hidden for roles without pricing access */}
      {canSeePricing && (
      <div className="qb-pricing">
        <div className="qb-pricing-inner">
          <div className="qb-price-cell">
            <span className="qb-price-k">Cost price</span>
            <span className="qb-price-v">{inr(t.costPrice)}</span>
          </div>
          <span className="qb-price-op">+</span>
          <div className="qb-price-cell narrow">
            <span className="qb-price-k">Markup {q.markupMode === 'percent' ? '%' : '₹'}</span>
            <input className="qb-price-input" type="number" value={q.markupValue} onChange={(e) => upd({ markupValue: e.target.value })} />
          </div>
          <span className="qb-price-op">+</span>
          <div className="qb-price-cell narrow">
            <span className="qb-price-k">Tax {q.taxEnabled ? `${num(q.taxPercent)}%` : 'off'}</span>
            <span className="qb-price-v sm">{inr(t.tax)}</span>
          </div>
          <span className="qb-price-arrow"><Icon name="chevron" size={16} className="qb-arrow-r" /></span>
          <div className="qb-price-final">
            <span className="qb-final-k">Option {oi + 1} selling {t.roundTo ? `· round ${t.roundTo}` : ''}</span>
            <span className="qb-final-v">{inr(t.grandTotal)}</span>
            <span className="qb-final-profit">profit {inr(t.profit)}</span>
          </div>
          <Button size="lg" onClick={save}>{editing ? 'Update' : 'Save Quote'}</Button>
        </div>
      </div>
      )}
    </div>
  )
}

/* ============================ sub-components ============================ */
function Section({ icon, title, desc, total, onAdd, addLabel, actions, toolbar, children }) {
  const { canSeePricing } = useApp()
  return (
    <section className="qb-section">
      <div className="qb-section-head">
        <span className="qb-section-ic"><Icon name={icon} size={18} /></span>
        <div className="qb-section-meta">
          <div className="qb-section-title">{title}</div>
          <div className="qb-section-desc">{desc}</div>
        </div>
        <div className="qb-section-right">
          {canSeePricing && total > 0 && <span className="qb-section-total">{inr(total)}</span>}
        </div>
      </div>
      {toolbar && <div className="qb-section-toolbar">{toolbar}</div>}
      <div className="qb-section-body">{children}</div>
      <div className="qb-section-actions">
        {actions || <Button size="sm" variant="secondary" onClick={onAdd}><Icon name="plus" size={14} /> {addLabel}</Button>}
      </div>
    </section>
  )
}

function ItemCard({ children, onDup, onRemove, tag, tagTone }) {
  return (
    <div className="qb-item">
      <div className={`qb-item-main ${children[1] ? '' : 'no-price'}`}>{children[0]}{children[1]}</div>
      <div className="qb-item-foot">
        {tag && <span className={`qb-item-tag ${tagTone ? `tone-${tagTone}` : ''}`}>{tag}</span>}
        <div className="qb-item-acts">
          {onDup && <button className="qb-act" onClick={onDup}><Icon name="copy" size={14} /> Duplicate</button>}
          {onRemove && <button className="qb-act danger" onClick={onRemove}><Icon name="trash" size={14} /> Remove</button>}
        </div>
      </div>
    </div>
  )
}

function ChipRow({ items, selected, onToggle, label }) {
  return (
    <div className="qb-chips">
      {items.map((n) => {
        const l = label(n)
        return (
          <button key={n} title={l.title || ''} className={`qb-chip ${selected.includes(n) ? 'on' : ''}`} onClick={() => onToggle(n)}>
            <span className="qb-chip-top">{l.top}</span>
            {l.sub && <span className="qb-chip-sub">{l.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

function PricePanel({ title = 'Prices', rows, cost, sell, emptyHint }) {
  const { canSeePricing } = useApp()
  if (!canSeePricing) return null
  return (
    <div className="qb-price-panel">
      <div className="qb-pp-head">{title}</div>
      {rows.length === 0 ? (
        <div className="qb-pp-empty">{emptyHint || 'No lines yet'}</div>
      ) : (
        <>
          <div className="qb-pp-cols"><span>Date</span><span>Rate</span><span>Given</span></div>
          <div className="qb-pp-rows">
            {rows.map((r, i) => (
              <div className="qb-pp-row" key={i}>
                <div className="qb-pp-date">{r.label}{r.sub && <span className="qb-pp-sub">{r.sub}</span>}</div>
                <div className="qb-pp-rate">{inr(r.rate)}</div>
                <div className="qb-pp-val">{inr(r.val)}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="qb-pp-tot">
        <span className="qb-pp-cost">cost {inr(cost)}</span>
        <span className="qb-pp-sell">{inr(sell)}</span>
      </div>
    </div>
  )
}

function Empty({ text }) { return <div className="qb-empty">{text}</div> }

/* ---------- Inclusions / Exclusions checkbox column ---------- */
function IEList({ title, tone, master, selected, onToggle, onAddCustom }) {
  const [draft, setDraft] = useState('')
  const custom = selected.filter((x) => !master.includes(x))
  const all = [...master, ...custom]
  const add = () => { const t = draft.trim(); if (!t) return; onAddCustom(t); setDraft('') }
  return (
    <div className="qb-ie-col">
      <div className={`qb-ie-h ${tone}`}>{title}<span>{selected.length} selected</span></div>
      {all.map((x) => (
        <label className="qb-ie-line" key={x}>
          <input type="checkbox" checked={selected.includes(x)} onChange={() => onToggle(x)} />
          <span className="qb-check-box"><Icon name="check" size={12} strokeWidth={2.6} /></span>
          <span className="qb-ie-txt">{x}</span>
          {!master.includes(x) && <span className="qb-ie-custom">custom</span>}
        </label>
      ))}
      <div className="qb-ie-add">
        <input className="control" value={draft} placeholder={`Add a custom ${title.toLowerCase().replace(/s$/, '')}…`}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="qb-act" onClick={add}><Icon name="plus" size={14} /> Add</button>
      </div>
    </div>
  )
}

/* ---------- Searchable hotel picker (name + City · Star) ---------- */
function HotelPicker({ value, hotels, destFilter = [], onPick, placeholder = 'Select hotel' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const hasFilter = destFilter.length > 0
  const scoped = hasFilter ? hotels.filter((h) => destFilter.includes(h.destination)) : hotels
  const base = hasFilter && !showAll ? scoped : hotels
  const shown = query.trim() ? base.filter((h) => `${h.name} ${h.city}`.toLowerCase().includes(query.trim().toLowerCase())) : base
  const sub = value?.city ? `${value.city}${value.star ? ` · ${value.star} Star` : ''}` : ''
  return (
    <div className="pill-select-wrap">
      <button className={`pill-select hp-select ${open ? 'open' : ''} ${!value?.name ? 'pms-empty' : ''}`} onClick={() => setOpen((o) => !o)}>
        <span className="hp-value">
          {value?.name ? <><span className="hp-name">{value.name}</span>{sub && <span className="hp-sub">{sub}</span>}</> : placeholder}
        </span>
        <span className={`pill-select-chev ${open ? 'up' : ''}`}><Icon name="chevron" size={14} strokeWidth={2} /></span>
      </button>
      {open && (
        <>
          <div className="pill-menu-scrim" onClick={() => setOpen(false)} />
          <div className="pill-menu hp-menu">
            <div className="pms-search"><Icon name="search" size={13} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search hotels…" /></div>
            {hasFilter && (
              <label className="hp-dest-filter">
                <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                <span>Show all destinations <span className="hp-dest-hint">(scoped to {destFilter.join(', ')} by default)</span></span>
              </label>
            )}
            <div className="hp-list">
              {shown.length === 0 && <div className="pms-none">No hotels match{query ? ` “${query}”` : ` this destination`}{hasFilter && !showAll ? ' — try Show all destinations' : ''}</div>}
              {shown.map((h) => (
                <button key={h.id} className={`pill-menu-item hp-item ${h.id === value?.id ? 'selected' : ''}`} onClick={() => { onPick(h); setOpen(false); setQuery('') }}>
                  <span className="hp-name">{h.name}</span>
                  <span className="hp-sub">{h.city}{h.rating ? ` · ${h.rating} Star` : ''}{h.destination ? ` · ${h.destination}` : ''}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Master picker (search a master list + allow a custom entry) ---------- */
function MasterPicker({ value, items = [], destFilter = [], onPick, placeholder = 'Select…', sub }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const hasFilter = destFilter.length > 0
  const scoped = hasFilter ? items.filter((it) => destFilter.includes(it.destination)) : items
  const base = hasFilter && !showAll ? scoped : items
  const q = query.trim().toLowerCase()
  const shown = q ? base.filter((it) => it.name.toLowerCase().includes(q)) : base
  const exact = items.some((it) => it.name.toLowerCase() === q)
  return (
    <div className="pill-select-wrap">
      <button className={`pill-select hp-select ${open ? 'open' : ''} ${!value ? 'pms-empty' : ''}`} onClick={() => setOpen((o) => !o)}>
        <span className="hp-value">{value ? <span className="hp-name">{value}</span> : placeholder}</span>
        <span className={`pill-select-chev ${open ? 'up' : ''}`}><Icon name="chevron" size={14} strokeWidth={2} /></span>
      </button>
      {open && (
        <>
          <div className="pill-menu-scrim" onClick={() => setOpen(false)} />
          <div className="pill-menu hp-menu">
            <div className="pms-search"><Icon name="search" size={13} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search master…" /></div>
            {hasFilter && (
              <label className="hp-dest-filter">
                <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                <span>Show all destinations <span className="hp-dest-hint">(scoped to {destFilter.join(', ')} by default)</span></span>
              </label>
            )}
            <div className="hp-list">
              {shown.map((it) => (
                <button key={it.id} className={`pill-menu-item hp-item ${it.name === value ? 'selected' : ''}`} onClick={() => { onPick(it); setOpen(false); setQuery('') }}>
                  <span className="hp-name">{it.name}</span>
                  {sub && <span className="hp-sub">{sub(it)}</span>}
                </button>
              ))}
              {query.trim() && !exact && (
                <button className="pill-menu-item hp-item" onClick={() => { onPick({ id: 'custom', name: query.trim(), custom: true }); setOpen(false); setQuery('') }}>
                  <span className="hp-name">Use “{query.trim()}”</span>
                  <span className="hp-sub">custom entry</span>
                </button>
              )}
              {shown.length === 0 && !query.trim() && <div className="pms-none">No master entries{hasFilter && !showAll ? ' for this destination — try Show all destinations' : ' yet'}</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Custom time picker (no native time input) ---------- */
function TimePicker({ value, onChange, placeholder = '--:--' }) {
  const [open, setOpen] = useState(false)
  const [h, m] = (value || '').split(':')
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const mins = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
  const setH = (hh) => onChange(`${hh}:${m || '00'}`)
  const setM = (mm) => onChange(`${h || '00'}:${mm}`)
  return (
    <div className="pill-select-wrap">
      <button className={`pill-select tp-select ${open ? 'open' : ''} ${!value ? 'pms-empty' : ''}`} onClick={() => setOpen((o) => !o)}>
        <span className="tp-value">{value || placeholder}</span>
        <span className="tp-ic"><Icon name="clock" size={14} /></span>
      </button>
      {open && (
        <>
          <div className="pill-menu-scrim" onClick={() => setOpen(false)} />
          <div className="pill-menu tp-menu">
            <div className="tp-cols">
              <div className="tp-col">
                <div className="tp-col-h">Hr</div>
                <div className="tp-scroll">{hours.map((hh) => <button key={hh} className={`tp-cell ${hh === h ? 'on' : ''}`} onClick={() => setH(hh)}>{hh}</button>)}</div>
              </div>
              <div className="tp-col">
                <div className="tp-col-h">Min</div>
                <div className="tp-scroll">{mins.map((mm) => <button key={mm} className={`tp-cell ${mm === m ? 'on' : ''}`} onClick={() => setM(mm)}>{mm}</button>)}</div>
              </div>
            </div>
            <div className="tp-foot"><Button size="sm" onClick={() => setOpen(false)}>Done</Button></div>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------------- Flight card (rich route display + edit) ---------------- */
const CABIN = ['Economy', 'Premium Economy', 'Business', 'First']
const STOPS = ['Non-stop', '1 stop', '2+ stops']
function flightDuration(f) {
  if (!f.depTime || !f.arrTime) return ''
  const dep = new Date(`${f.depDate || '2000-01-01'}T${f.depTime}`)
  const arr = new Date(`${f.arrDate || f.depDate || '2000-01-01'}T${f.arrTime}`)
  let mins = Math.round((arr - dep) / 60000)
  if (isNaN(mins)) return ''
  if (mins < 0) mins += 24 * 60
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}
function fmtFlightDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function FlightCard({ f, adults, childs, infants, onTravellers, onChange, onRemove }) {
  const dur = flightDuration(f)
  const { canSeePricing } = useApp()
  return (
    <div className="qb-item qb-flight-item">
      <div className={`qb-item-main ${canSeePricing ? '' : 'no-price'}`}>
        <div className="qb-fields">
          <div className="qb-flight-tabs">
            {['Round trip', 'One way', 'Multi city'].map((k) => (
              <button key={k} className={`qb-flight-tab ${f.kind === k ? 'on' : ''}`} onClick={() => onChange({ kind: k })}>{k}</button>
            ))}
          </div>

          {f.editing ? <FlightForm f={f} onChange={onChange} /> : <FlightSummary f={f} dur={dur} onEdit={() => onChange({ editing: true })} />}

          <div className="qb-fl-travellers">
            <span className="qb-fl-trav-title">Traveller</span>
            <div className="qb-fl-trav-grid">
              <label>Adults<input type="number" min="0" value={adults} onChange={(e) => onTravellers({ adults: e.target.value })} /></label>
              <label>Children<span className="qb-fl-hint">2–12 yrs</span><input type="number" min="0" value={childs} onChange={(e) => onTravellers({ children: e.target.value })} /></label>
              <label>Infants<span className="qb-fl-hint">below 2</span><input type="number" min="0" value={infants} onChange={(e) => onTravellers({ infants: e.target.value })} /></label>
            </div>
          </div>
        </div>
        <PricePanel title="Flight price" rows={[{ label: `${f.fromCode || f.fromCity || '—'} → ${f.toCode || f.toCity || '—'}`, sub: f.kind, rate: num(f.cost), val: num(f.sell) }]} cost={num(f.cost)} sell={num(f.sell)} />
      </div>
      <div className="qb-item-foot">
        <span className="qb-item-tag tone-transport">{f.kind}</span>
        <div className="qb-item-acts">
          <button className="qb-act" onClick={() => onChange({ editing: !f.editing })}>{f.editing ? '✓ Done' : 'Edit'}</button>
          <button className="qb-act danger" onClick={onRemove}><Icon name="trash" size={14} /> Remove</button>
        </div>
      </div>
    </div>
  )
}

function FlightSummary({ f, dur, onEdit }) {
  return (
    <div className="qb-fl-card">
      <div className="qb-fl-head">
        <span className="qb-fl-plane"><Icon name="plane" size={15} /></span>
        <span className="qb-fl-route-title">{f.fromCity || f.fromCode || 'From'}<span className="qb-fl-dash">———</span>{f.toCity || f.toCode || 'To'}</span>
        {f.flightNo && <span className="qb-fl-no">· {f.flightNo}</span>}
        <div className="qb-fl-badges">
          <span className="qb-fl-badge">{f.kind}</span>
          {f.stops && <span className="qb-fl-badge green">{f.stops}</span>}
        </div>
      </div>
      <div className="qb-fl-body">
        <div className="qb-fl-end">
          <div className="qb-fl-time"><b>{f.depTime || '--:--'}</b> {f.fromCity || ''}</div>
          <div className="qb-fl-date">{fmtFlightDate(f.depDate) || '—'}</div>
          <div className="qb-fl-airport">{f.fromCode ? <b>{f.fromCode}</b> : null} {f.fromAirport || ''}</div>
          {f.fromTerminal && <div className="qb-fl-term">Terminal {f.fromTerminal}</div>}
        </div>
        <div className="qb-fl-mid">
          <span className="qb-fl-dur">{dur || '—'}</span>
          <span className="qb-fl-line"><span className="qb-fl-dot" /><Icon name="clock" size={13} /><span className="qb-fl-dot" /></span>
        </div>
        <div className="qb-fl-end right">
          <div className="qb-fl-time"><b>{f.arrTime || '--:--'}</b> {f.toCity || ''}</div>
          <div className="qb-fl-date">{fmtFlightDate(f.arrDate) || '—'}</div>
          <div className="qb-fl-airport">{f.toCode ? <b>{f.toCode}</b> : null} {f.toAirport || ''}</div>
          {f.toTerminal && <div className="qb-fl-term">Terminal {f.toTerminal}</div>}
        </div>
      </div>
      <div className="qb-fl-foot">
        <span className="qb-fl-class">Class: {f.cabinClass || 'Economy'}</span>
        <button className="qb-fl-edit" onClick={onEdit}>Edit</button>
      </div>
      {f.ticketImg && <img className="qb-fl-ticket-img" src={f.ticketImg} alt="Flight ticket" />}
    </div>
  )
}

function FlightForm({ f, onChange }) {
  const { canSeePricing } = useApp()
  return (
    <div className="qb-fl-form">
      <div className="qb-grid-4">
        <Field label="Airline"><Input value={f.airline} onChange={(e) => onChange({ airline: e.target.value })} placeholder="IndiGo" /></Field>
        <Field label="Flight no."><Input value={f.flightNo} onChange={(e) => onChange({ flightNo: e.target.value })} placeholder="AI-111" /></Field>
        <Field label="Class"><PillSelect value={f.cabinClass || 'Economy'} options={CABIN} onChange={(v) => onChange({ cabinClass: v })} /></Field>
        <Field label="Stops"><PillSelect value={f.stops || 'Non-stop'} options={STOPS} onChange={(v) => onChange({ stops: v })} /></Field>
      </div>
      <div className="qb-fl-leg">
        <div className="qb-fl-leg-title">Departure</div>
        <div className="qb-grid-4">
          <Field label="City"><Input value={f.fromCity} onChange={(e) => onChange({ fromCity: e.target.value })} placeholder="New Delhi" /></Field>
          <Field label="Code"><Input value={f.fromCode} onChange={(e) => onChange({ fromCode: e.target.value.toUpperCase().slice(0, 4) })} placeholder="DEL" /></Field>
          <Field label="Date"><DatePicker value={f.depDate} onChange={(v) => onChange({ depDate: v })} placeholder="Pick date" /></Field>
          <Field label="Time"><TimePicker value={f.depTime} onChange={(v) => onChange({ depTime: v })} /></Field>
          <Field label="Airport" full><Input value={f.fromAirport} onChange={(e) => onChange({ fromAirport: e.target.value })} placeholder="Indira Gandhi International Airport" /></Field>
          <Field label="Terminal"><Input value={f.fromTerminal} onChange={(e) => onChange({ fromTerminal: e.target.value })} placeholder="3" /></Field>
        </div>
      </div>
      <div className="qb-fl-leg">
        <div className="qb-fl-leg-title">Arrival</div>
        <div className="qb-grid-4">
          <Field label="City"><Input value={f.toCity} onChange={(e) => onChange({ toCity: e.target.value })} placeholder="London" /></Field>
          <Field label="Code"><Input value={f.toCode} onChange={(e) => onChange({ toCode: e.target.value.toUpperCase().slice(0, 4) })} placeholder="LHR" /></Field>
          <Field label="Date"><DatePicker value={f.arrDate} onChange={(v) => onChange({ arrDate: v })} placeholder="Pick date" /></Field>
          <Field label="Time"><TimePicker value={f.arrTime} onChange={(v) => onChange({ arrTime: v })} /></Field>
          <Field label="Airport" full><Input value={f.toAirport} onChange={(e) => onChange({ toAirport: e.target.value })} placeholder="London Heathrow Airport" /></Field>
          <Field label="Terminal"><Input value={f.toTerminal} onChange={(e) => onChange({ toTerminal: e.target.value })} placeholder="2" /></Field>
        </div>
      </div>
      {canSeePricing && (
        <div className="qb-grid-2">
          <Field label="Cost (₹)"><Input type="number" value={f.cost} onChange={(e) => onChange({ cost: e.target.value })} placeholder="0" /></Field>
          <Field label="Given (₹)"><Input type="number" value={f.sell} onChange={(e) => onChange({ sell: e.target.value })} placeholder="0" /></Field>
        </div>
      )}
      <div className="qb-fl-ticket">
        <ImageInput label="Flight ticket / fare screenshot" hint="uploaded & attached to the shared PDF" maxW={1400}
          value={f.ticketImg || ''} onChange={(v) => onChange({ ticketImg: v })} />
      </div>
    </div>
  )
}

function blankFlight(kind) {
  return {
    id: uid(), kind, editing: true, airline: '', flightNo: '', cabinClass: 'Economy', stops: 'Non-stop',
    fromCity: '', fromCode: '', fromAirport: '', fromTerminal: '', toCity: '', toCode: '', toAirport: '', toTerminal: '',
    depDate: '', depTime: '', arrDate: '', arrTime: '', cost: '', sell: '', ticketImg: '',
  }
}

/* ============================ pure helpers ============================ */
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v].sort((a, b) => a - b))
const hotelRooms = (hotels, id) => { const h = hotels.find((x) => x.id === id); const list = h?.roomTypes ? h.roomTypes.split(',').map((s) => s.trim()) : []; return list.length ? list : ROOM_TYPES }
function cityForNight(sectors, n) {
  let acc = 0
  for (const s of sectors || []) { acc += Math.max(0, num(s.nights)); if (n <= acc) return s.destination || '' }
  return (sectors && sectors[sectors.length - 1]?.destination) || ''
}
const sectorsFrom = (destStr, nights) => {
  const dests = (destStr || '').split(',').map((s) => s.trim()).filter((s) => s && s !== 'General Inquiry')
  if (dests.length <= 1) return [{ id: uid(), destination: dests[0] || '', nights: Math.max(1, num(nights)) }]
  // spread nights across destinations, remainder to the first
  const per = Math.floor(nights / dests.length); const rem = nights - per * dests.length
  return dests.map((d, i) => ({ id: uid(), destination: d, nights: Math.max(1, per + (i === 0 ? rem : 0)) }))
}

function blankOption(name) {
  return { id: uid(), name, sameCab: false, sameCabId: '', sameCabName: '', stays: [], services: [], flights: [], extras: [], sellingOverride: '' }
}
function blankStay(q, opt) {
  return { id: uid(), nights: [], hotelId: '', hotelName: '', hotelCity: '', hotelStar: '', hotelImage: '', hotelDescription: '', mealPlan: 'CP', roomType: 'Deluxe', paxPerRoom: 2, rooms: q.rooms || 1, aweb: 0, cweb: 0, cnb: 0, awebRate: 0, cwebRate: 0, cnbRate: 0, compChild: COMP_CHILD[1], rate: '', given: '' }
}
function blankService(kind, opt, q) {
  return { id: uid(), kind, days: [], location: '', serviceType: kind === 'transport' ? 'Arrival Transfer' : '', description: '', durationMins: '', qty: kind === 'activity' ? (num(q.adults) || 1) : 1, cabId: opt.sameCabId || '', cabName: opt.sameCabName || '', rate: '', given: '' }
}

// hotel line = (base × rooms + extra-bed charges) × nights; bed rates come from the hotel master
const bedPerNight = (st) => num(st.aweb) * num(st.awebRate) + num(st.cweb) * num(st.cwebRate) + num(st.cnb) * num(st.cnbRate)
const stayCost = (st) => (num(st.rate) * num(st.rooms) + bedPerNight(st)) * st.nights.length
const staySell = (st) => (num(st.given) * num(st.rooms) + bedPerNight(st)) * st.nights.length

function optionTotals(opt, q) {
  const hotelCost = opt.stays.reduce((s, st) => s + stayCost(st), 0)
  const hotelSell = opt.stays.reduce((s, st) => s + staySell(st), 0)
  const svc = (kind) => opt.services.filter((s) => s.kind === kind)
  const sumSvc = (kind, field) => svc(kind).reduce((s, x) => s + num(x[field]) * (num(x.qty) || 1) * Math.max(1, x.days.length), 0)
  const transportCost = sumSvc('transport', 'rate'), transportSell = sumSvc('transport', 'given')
  const activityCost = sumSvc('activity', 'rate'), activitySell = sumSvc('activity', 'given')
  const flightCost = opt.flights.reduce((s, f) => s + num(f.cost), 0)
  const flightSell = opt.flights.reduce((s, f) => s + num(f.sell), 0)
  const extraCost = opt.extras.reduce((s, e) => s + num(e.cost), 0)
  const extraSell = opt.extras.reduce((s, e) => s + num(e.sell), 0)
  const costPrice = hotelCost + transportCost + activityCost + flightCost + extraCost
  const sellSum = hotelSell + transportSell + activitySell + flightSell + extraSell
  // ---- Markup → Tax → Rounding engine (selling built up from cost) ----
  const markup = q.markupMode === 'flat' ? num(q.markupValue) : costPrice * num(q.markupValue) / 100
  const taxBase = q.taxOn === 'cost_markup' ? costPrice + markup : costPrice
  const tax = q.taxEnabled ? Math.round(taxBase * num(q.taxPercent) / 100 * 100) / 100 : 0
  const preRound = costPrice + markup + tax
  const roundTo = num(q.roundTo)
  const grandTotal = roundTo ? Math.round(preRound / roundTo) * roundTo : Math.round(preRound)
  const sellingPrice = grandTotal
  const multiplier = costPrice ? (grandTotal / costPrice) : 0
  const profit = grandTotal - costPrice - tax
  return { hotelCost, hotelSell, transportCost, transportSell, activityCost, activitySell, flightCost, flightSell, extraCost, extraSell, costPrice, sellSum, markup, taxBase, tax, preRound, roundTo, sellingPrice, multiplier, grandTotal, profit }
}

/* ---------- per-destination inclusions / exclusions ---------- */
const destsOf = (sectors) => [...new Set((sectors || []).map((s) => s.destination).filter(Boolean))]
// a destination's own master presets (empty when it has none — there is no general list)
const presetsForDest = (presets, dest) => (dest && presets?.byDest?.[dest]) || { inclusions: [], exclusions: [] }
// build { [dest]: { inclusions, exclusions } } for a trip's destinations, seeding
// from a legacy package's grouped or flat lists when re-opening, else each
// destination's own master presets
function seedIE(sectors, presets, legacy) {
  const keys = destsOf(sectors)
  const list = keys.length ? keys : ['']
  const out = {}
  if (legacy?.inclusionGroups?.length) {
    legacy.inclusionGroups.forEach((g) => { out[g.destination || ''] = { inclusions: [...(g.inclusions || [])], exclusions: [...(g.exclusions || [])] } })
  }
  const flatInc = legacy?.inclusions, flatExc = legacy?.exclusions
  list.forEach((d) => {
    if (out[d]) return
    if (flatInc || flatExc) { out[d] = { inclusions: [...(flatInc || [])], exclusions: [...(flatExc || [])] } }
    else { const pd = presetsForDest(presets, d); out[d] = { inclusions: [...pd.inclusions], exclusions: [...pd.exclusions] } }
  })
  return out
}

/* ---------- init (new / edit / from-template) ---------- */
function init(editing, preClient, tpl, hotels, presets) {
  if (!editing && tpl) return fromTemplate(tpl, preClient, hotels, presets)
  if (editing?.builderV2) {
    const b = editing.builderV2
    const sectors = b.sectors?.length ? b.sectors.map((s) => ({ ...s, id: s.id || uid() })) : sectorsFrom((editing.destination || '').split(' - ')[0], editing.nights)
    const nights = Math.max(1, sectors.reduce((s, x) => s + num(x.nights), 0))
    const options = (b.options || []).map((o) => ({ ...o, name: o.name || o.star || 'Option' }))
    return { ...PRICING_DEFAULTS, taxPercent: editing.pricing?.gstPercent ?? PRICING_DEFAULTS.taxPercent, ...b, ieByDest: b.ieByDest || seedIE(sectors, presets, editing), options, sectors, clientId: editing.clientId, clientName: editing.clientName, clientPhone: editing.clientPhone, clientEmail: editing.clientEmail, destShort: sectors[0]?.destination || '', destination: sectors.map((s) => s.destination).filter(Boolean).join(', ') || editing.destination, startDate: editing.startDate, nights, days: nights + 1, comments: editing.comments || '' }
  }
  if (editing) return fromLegacy(editing, presets)
  const c = preClient
  const sectors = sectorsFrom(c?.interest, c?.query?.nights || 3)
  const nights = Math.max(1, sectors.reduce((s, x) => s + num(x.nights), 0))
  return {
    clientId: c?.id || '', clientName: c?.name || '', clientPhone: c?.phone || '', clientEmail: c?.email || '',
    sectors, destShort: sectors[0]?.destination || '', destination: sectors.map((s) => s.destination).filter(Boolean).join(', '),
    startDate: c?.query?.startDate || '', nights, days: nights + 1,
    adults: c?.query?.adults || 2, children: c?.query?.children || 0, rooms: Math.max(1, Math.ceil((c?.query?.adults || 2) / 2)),
    options: [blankOption('4 Star')],
    ieByDest: seedIE(sectors, presets),
    ...PRICING_DEFAULTS, comments: '',
  }
}

function fromLegacy(pkg, presets) {
  // reverse-map old / template-cloned packages into a single option so they stay editable
  const stays = []
  ;(pkg.hotelsAlloc || []).forEach((h) => {
    const last = stays[stays.length - 1]
    if (last && last.hotelName === h.name && last.roomType === h.roomType) last.nights.push(h.night)
    else stays.push({ id: uid(), nights: [h.night], hotelId: h.hotelId || '', hotelName: h.name, hotelCity: h.city || '', hotelStar: h.star || '', hotelImage: h.image || '', hotelDescription: h.description || '', mealPlan: h.mealPlan || 'CP', roomType: h.roomType || 'Deluxe', paxPerRoom: 2, rooms: 1, aweb: 0, cweb: 0, cnb: 0, compChild: COMP_CHILD[1], rate: String(h.net || 0), given: String(h.price || 0) })
  })
  const services = (pkg.cabs || []).map((c) => ({ id: uid(), kind: 'transport', days: c.days || [1], location: c.name || 'Transfer', serviceType: c.serviceType || 'Sightseeing', durationMins: '', qty: 1, cabId: c.cabId || '', cabName: c.type || '', rate: String(c.total ? Math.round(c.total / Math.max(1, (c.days || [1]).length)) : (num(c.km) * num(c.rate))), given: String(c.total ? Math.round(c.total / Math.max(1, (c.days || [1]).length)) : (num(c.km) * num(c.rate))) }))
  const extras = (pkg.categories || []).map((cat) => ({ id: uid(), name: cat.name, note: cat.description || '', cost: '', sell: String(cat.amount || 0) }))
  const option = { ...blankOption('4 Star'), stays, services, extras }
  const legShort = (pkg.destination || '').split(' - ')[0]
  const legSectors = sectorsFrom(legShort, pkg.nights || 1)
  return {
    clientId: pkg.clientId || '', clientName: pkg.clientName || '', clientPhone: pkg.clientPhone || '', clientEmail: pkg.clientEmail || '',
    sectors: legSectors, destShort: legShort, destination: pkg.destination || '',
    startDate: pkg.startDate || '', nights: pkg.nights || 1, days: pkg.days || 2,
    adults: pkg.pax?.adults || 2, children: pkg.pax?.children || 0, rooms: pkg.pax?.rooms || 1,
    options: [option],
    ieByDest: seedIE(legSectors, presets, pkg),
    ...PRICING_DEFAULTS, taxPercent: pkg.pricing?.gstPercent ?? 5, comments: pkg.comments || '',
  }
}

/* ---------- from-template (a template is package-shaped) ---------- */
function sectorsFromHotels(tpl, hotels) {
  const order = [], map = {}
  ;(tpl.hotelsAlloc || []).forEach((h) => {
    const hotel = (hotels || []).find((x) => x.id === h.hotelId)
    const city = hotel?.city || tpl.destination
    if (!(city in map)) { map[city] = 0; order.push(city) }
    map[city]++
  })
  if (order.length === 0) return [{ id: uid(), destination: tpl.destination || '', nights: tpl.nights || 1 }]
  return order.map((city) => ({ id: uid(), destination: city, nights: map[city] }))
}

function fromTemplate(tpl, preClient, hotels, presets) {
  const base = fromLegacy(tpl, presets)     // maps hotelsAlloc→stays, cabs→transport, categories→extras
  const sectors = sectorsFromHotels(tpl, hotels)
  const nights = Math.max(1, sectors.reduce((s, x) => s + num(x.nights), 0))
  const c = preClient
  return {
    ...base,
    clientId: c?.id || '', clientName: c?.name || '', clientPhone: c?.phone || '', clientEmail: c?.email || '',
    startDate: c?.query?.startDate || base.startDate || '',
    adults: c?.query?.adults || base.adults, children: c?.query?.children || base.children,
    rooms: c ? Math.max(1, Math.ceil((c?.query?.adults || 2) / 2)) : base.rooms,
    sectors, destShort: sectors[0]?.destination || base.destShort,
    destination: sectors.map((s) => s.destination).filter(Boolean).join(', ') || base.destination,
    ieByDest: seedIE(sectors, presets, tpl),
    nights, days: nights + 1,
    comments: base.comments || `Started from template: ${tpl.name}`,
  }
}

/* ---------- completeness → drives Draft vs Quoted ----------
   A quote is "complete" (ready = Quoted) only when every core section is
   filled: a named guest, a start date, at least one destination, hotels
   covering every night, and a real selling price. Anything missing keeps it a
   Draft that can still be saved now and finished later. */
function isQuoteComplete(q, opt, t) {
  const hasClient = !!(q.clientName || '').trim()
  const hasDate = !!q.startDate
  const hasDest = (q.sectors || []).some((s) => s.destination)
  const nights = num(q.nights)
  const covered = new Set((opt?.stays || []).filter((s) => s.hotelName).flatMap((s) => s.nights || []))
  const hotelsCoverNights = nights > 0 && Array.from({ length: nights }, (_, i) => i + 1).every((n) => covered.has(n))
  const hasPrice = num(t?.grandTotal) > 0
  return hasClient && hasDate && hasDest && hotelsCoverNights && hasPrice
}

/* ---------- serialize (active option → package record) ---------- */
function serialize(q, oi, t, destinations, presets) {
  const opt = q.options[oi]
  const complete = isQuoteComplete(q, opt, t)
  const sectors = (q.sectors || []).filter((s) => s.destination)
  const destLabel = sectors.length === 1
    ? (() => { const d = destinations.find((x) => x.name === sectors[0].destination); return d ? `${d.name} - ${d.location}` : (sectors[0].destination || q.destShort) })()
    : (sectors.map((s) => s.destination).join(', ') || q.destination || q.destShort)
  const hotelsAlloc = opt.stays.flatMap((s) => { const bed = bedPerNight(s); return s.nights.map((n) => ({ night: n, hotelId: s.hotelId, name: s.hotelName, city: s.hotelCity || cityForNight(q.sectors, n), star: s.hotelStar, image: s.hotelImage || '', description: s.hotelDescription || '', roomType: s.roomType, mealPlan: s.mealPlan, rooms: num(s.rooms), aweb: num(s.aweb), cweb: num(s.cweb), cnb: num(s.cnb), price: num(s.given) * num(s.rooms) + bed, net: num(s.rate) * num(s.rooms) + bed })) })
    .sort((a, b) => a.night - b.night)
  const transports = opt.services.filter((s) => s.kind === 'transport')
  const activities = opt.services.filter((s) => s.kind === 'activity')
  const cabsOut = transports.map((tr) => ({ cabId: tr.cabId, name: tr.location, type: opt.sameCab ? opt.sameCabName : tr.cabName, km: 0, rate: num(tr.rate), given: num(tr.given), total: num(tr.given) * (num(tr.qty) || 1) * Math.max(1, tr.days.length), days: tr.days, serviceType: tr.serviceType, description: tr.description || '', durationMins: num(tr.durationMins), qty: num(tr.qty) || 1, image: tr.image || '' }))
  const categories = [
    ...activities.map((a) => ({ kind: 'activity', name: a.location || 'Activity', description: a.description || a.serviceType || '', serviceType: a.serviceType || '', durationMins: num(a.durationMins), qty: num(a.qty) || 1, days: a.days, image: a.image || '', amount: num(a.given) * (num(a.qty) || 1) * Math.max(1, a.days.length) })),
    ...opt.extras.map((e) => ({ name: e.name, description: e.note || '', amount: num(e.sell) })),
    ...opt.flights.map((f) => ({ name: `Flight · ${f.kind}`, description: `${f.fromCode || f.fromCity || ''} → ${f.toCode || f.toCity || ''}`, amount: num(f.sell) })),
  ]
  const dayCity = (d) => cityForNight(q.sectors, Math.min(d, q.nights))
  const itinerary = Array.from({ length: q.days }, (_, i) => {
    const dnum = i + 1
    const svcs = opt.services.filter((s) => s.days.includes(dnum))
    const stay = opt.stays.find((s) => s.nights.includes(dnum))
    const dayDest = dayCity(dnum) || q.destShort
    const title = svcs[0]?.location || (dnum === q.days ? 'Departure' : `Day ${dnum}`)
    const serviceText = svcs.map((s) => [s.location, s.description].filter(Boolean).join(' — ')).filter(Boolean).join('; ')
    return {
      day: dnum, title, template: '', mealPlan: stay?.mealPlan || '',
      description: serviceText || (stay ? `Stay at ${stay.hotelName}` : ''),
      activities: svcs.map((s) => s.serviceType).filter(Boolean).join(', '),
      stops: [{ destination: dayDest, date: '', activity: svcs.map((s) => s.location || s.serviceType).filter(Boolean).join(', ') }],
      services: svcs.map((s) => ({ kind: s.kind, name: s.location, serviceType: s.serviceType, description: s.description, durationMins: s.durationMins, image: s.image, qty: s.qty, cabId: s.cabId, cabName: s.cabName })),
      travel: '', notes: '',
    }
  })
  // per-destination inclusions / exclusions → grouped list + a flat de-duplicated
  // union so every legacy reader (invoices, itinerary preview, …) keeps working
  const ieKeys = [...new Set(sectors.map((s) => s.destination).filter(Boolean))]
  const ieDefaults = { inclusions: [...(presets?.inclusions || [])], exclusions: [...(presets?.exclusions || [])] }
  const inclusionGroups = (ieKeys.length ? ieKeys : ['']).map((d) => {
    const ie = q.ieByDest?.[d] || ieDefaults
    return { destination: d, inclusions: [...(ie.inclusions || [])], exclusions: [...(ie.exclusions || [])] }
  })
  const flatInclusions = [...new Set(inclusionGroups.flatMap((g) => g.inclusions))]
  const flatExclusions = [...new Set(inclusionGroups.flatMap((g) => g.exclusions))]
  return {
    clientId: q.clientId, clientName: q.clientName, clientPhone: q.clientPhone, clientEmail: q.clientEmail, clientAddress: '',
    destination: destLabel,
    sectors: q.sectors,
    fromLocation: '', route: '',
    days: q.days, nights: q.nights, startDate: q.startDate,
    pax: { total: num(q.adults) + num(q.children), adults: num(q.adults), children: num(q.children), infants: num(q.infants), childrenNoBed: 0, extraBeds: 0, rooms: num(q.rooms), roomType: opt.stays[0]?.roomType || 'Deluxe' },
    flightIncluded: opt.flights.length > 0, flights: opt.flights,
    flight: opt.flights[0] ? { ...opt.flights[0], depart: `${opt.flights[0].fromCode || ''} ${opt.flights[0].depTime || ''}`.trim(), arrive: `${opt.flights[0].toCode || ''} ${opt.flights[0].arrTime || ''}`.trim() } : { airline: '', flightNo: '', depart: '', arrive: '' },
    status: complete ? 'Quoted' : 'Draft',
    cabs: cabsOut, hotelsAlloc, itinerary,
    inclusions: flatInclusions, exclusions: flatExclusions, inclusionGroups,
    categories,
    pricing: {
      mode: 'Builder', costPrice: t.costPrice, sellingPrice: t.grandTotal, grandTotal: t.grandTotal, profit: t.profit,
      markupMode: q.markupMode, markupValue: num(q.markupValue), markup: t.markup,
      taxOn: q.taxOn, taxEnabled: q.taxEnabled, taxPercent: num(q.taxPercent), tax: t.tax, roundTo: num(q.roundTo),
      gstPercent: num(q.taxPercent), gstAmount: t.tax, // legacy aliases for downstream detail/invoice
      hotelSell: t.hotelSell, transportSell: t.transportSell, activitySell: t.activitySell, flightSell: t.flightSell, extraSell: t.extraSell,
    },
    comments: q.comments, customerRemarks: q.customerRemarks || '',
    optionCount: q.options.length, activeOption: oi,
    builderV2: { clientId: q.clientId, adults: q.adults, children: q.children, infants: q.infants, rooms: q.rooms, sectors: q.sectors, options: q.options, ieByDest: q.ieByDest, markupMode: q.markupMode, markupValue: q.markupValue, taxOn: q.taxOn, taxEnabled: q.taxEnabled, taxPercent: q.taxPercent, roundTo: q.roundTo, customerRemarks: q.customerRemarks || '' },
  }
}
