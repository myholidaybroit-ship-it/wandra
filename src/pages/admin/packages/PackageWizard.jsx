import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Select, Textarea, Badge } from '../../../components/ui/UI'
import './wizard.css'

const SECTIONS = [
  { n: 1, key: 'client', icon: '◉', title: 'Client & Query Information', sub: 'Basic client details and passenger information', tag: 'Required', tone: 'required' },
  { n: 2, key: 'basics', icon: '⌖', title: 'Travel Basics', sub: 'Destination, dates and basic travel information', tag: 'Basic Info', tone: 'warning' },
  { n: 3, key: 'flight', icon: '', title: 'Flight Section', sub: 'Flight arrangements and details', tag: 'Optional', tone: 'warning' },
  { n: 4, key: 'meta', icon: '', title: 'Itinerary Meta', sub: 'Assignment, status, and route information', tag: 'Meta', tone: 'neutral' },
  { n: 5, key: 'cab', icon: '', title: 'Cab Section', sub: 'Transportation arrangements and vehicle selection', tag: 'Transport', tone: 'success' },
  { n: 6, key: 'hotel', icon: '⌂', title: 'Hotel Allocation', sub: 'Hotel selection and accommodation details', tag: 'Accommodation', tone: 'warning' },
  { n: 7, key: 'days', icon: '▦', title: 'Day-wise Itinerary Builder', sub: 'Detailed day-by-day travel schedule and destinations', tag: 'Schedule', tone: 'info' },
  { n: 8, key: 'incl', icon: '✓', title: 'Inclusions / Exclusions', sub: "What's included and excluded from the package", tag: 'Details', tone: 'neutral' },
  { n: 9, key: 'cats', icon: '', title: 'Other Package Categories', sub: 'Additional charges and custom categories', tag: 'Additional', tone: 'info' },
  { n: 10, key: 'pricing', icon: '₹', title: 'Pricing & Quotation', sub: 'Package pricing, discounts, and final calculations', tag: 'Financial', tone: 'info' },
]

export default function PackageWizard() {
  const app = useApp()
  const { clients, destinations, hotels, cabs, templates, inclusionPresets, categoryGroups, packages, addPackage, updatePackage, toast } = app
  const nav = useNavigate()
  const { id: editId } = useParams()
  const [searchParams] = useSearchParams()
  const editing = packages.find((p) => p.id === editId)
  const preClient = clients.find((x) => x.id === searchParams.get('client'))
  const [active, setActive] = useState(1)

  const [pkg, setPkg] = useState(editing ? {
    ...editing,
    autoNights: false,
    pax: { auto: true, ...editing.pax },
    flight: editing.flight || { airline: '', flightNo: '', depart: '', arrive: '' },
    cabIncluded: (editing.cabs || []).length > 0, cabs: editing.cabs?.length ? editing.cabs : [{ cabId: '', name: '', type: '', km: '', rate: '' }],
    hotelIncluded: (editing.hotelsAlloc || []).length > 0,
    pricing: { mode: 'Total', packageCost: '', childCost: '', discount: '', gstPercent: '', ...editing.pricing },
  } : {
    clientId: preClient?.id || '', clientName: preClient?.name || '', clientPhone: preClient?.phone || '',
    clientEmail: preClient?.email || '', clientAddress: preClient?.address || '',
    pax: { total: 4, adults: 4, children: 0, childrenNoBed: 0, extraBeds: 0, rooms: 2, roomType: 'Double / Twin', auto: true },
    destination: '', fromLocation: '', days: 1, nights: 0, autoNights: true, startDate: '',
    flightIncluded: false, flight: { airline: '', flightNo: '', depart: '', arrive: '' },
    status: 'Draft', route: '',
    cabIncluded: true, cabs: [{ cabId: '', name: '', type: '', km: '', rate: '', }],
    hotelIncluded: true, hotelsAlloc: [],
    itinerary: [blankDay(1)],
    inclusions: [...(inclusionPresets.inclusions || [])], exclusions: [...(inclusionPresets.exclusions || [])],
    categories: [],
    pricing: { mode: 'Total', packageCost: '', childCost: '', discount: '', gstPercent: '' },
  })
  const upd = (patch) => setPkg((p) => ({ ...p, ...patch }))
  const updPricing = (k, v) => setPkg((p) => ({ ...p, pricing: { ...p.pricing, [k]: v } }))

  function blankDay(n) { return { day: n, title: '', template: '', mealPlan: '', stops: [{ destination: '', date: '', activity: '' }], description: '', activities: '', travel: '', notes: '' } }

  // live pricing
  const live = useMemo(() => {
    const cabTotal = pkg.cabs.reduce((s, c) => s + (Number(c.km) || 0) * (Number(c.rate) || 0), 0)
    const hotelTotal = pkg.hotelsAlloc.reduce((s, h) => s + (Number(h.price) || 0), 0)
    const otherTotal = pkg.categories.reduce((s, c) => s + (Number(c.amount) || 0), 0)
    const base = Number(pkg.pricing.packageCost || 0) + Number(pkg.pricing.childCost || 0)
    const sub = base + cabTotal + hotelTotal + otherTotal - Number(pkg.pricing.discount || 0)
    const gst = Math.round((sub * Number(pkg.pricing.gstPercent || 0)) / 100)
    return { cabTotal, hotelTotal, otherTotal, grandTotal: Math.max(0, sub) + gst }
  }, [pkg])

  // ---- nights auto / hotel rows ----
  const setDays = (d) => {
    const days = Number(d) || 0
    const nights = pkg.autoNights ? Math.max(0, days - 1) : pkg.nights
    let hotelsAlloc = pkg.hotelsAlloc
    if (pkg.hotelIncluded) {
      hotelsAlloc = Array.from({ length: nights }, (_, i) => pkg.hotelsAlloc[i] || { night: i + 1, hotelId: '', name: '', roomType: '', price: '', net: 0 })
    }
    upd({ days, nights, hotelsAlloc })
  }

  // ---- cab helpers ----
  const setCab = (i, patch) => setPkg((p) => ({ ...p, cabs: p.cabs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }))
  const pickCab = (i, id) => {
    const c = cabs.find((x) => x.id === id)
    setCab(i, { cabId: id, name: c?.name || '', type: c?.type || '', rate: c?.ratePerKm || '' })
  }
  const addCabRow = () => setPkg((p) => ({ ...p, cabs: [...p.cabs, { cabId: '', name: '', type: '', km: '', rate: '' }] }))
  const rmCab = (i) => setPkg((p) => ({ ...p, cabs: p.cabs.filter((_, idx) => idx !== i) }))

  // ---- hotel helpers ----
  const setHotel = (i, patch) => setPkg((p) => ({ ...p, hotelsAlloc: p.hotelsAlloc.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) }))
  const pickHotel = (i, id) => { const h = hotels.find((x) => x.id === id); setHotel(i, { hotelId: id, name: h?.name || '', roomType: h?.roomTypes?.split(',')[0]?.trim() || '', net: h?.buyingPrice || 0 }) }

  // ---- day helpers ----
  const setDay = (i, patch) => setPkg((p) => ({ ...p, itinerary: p.itinerary.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) }))
  const pickTemplate = (i, name) => { const t = templates.find((x) => x.name === name); setDay(i, { template: name, title: name, mealPlan: t?.mealPlan || '', description: t?.description || '', activities: t?.activity || '' }) }
  const addDay = () => setPkg((p) => ({ ...p, itinerary: [...p.itinerary, blankDay(p.itinerary.length + 1)] }))
  const rmDay = (i) => setPkg((p) => ({ ...p, itinerary: p.itinerary.filter((_, idx) => idx !== i) }))
  const addStop = (di) => setPkg((p) => ({ ...p, itinerary: p.itinerary.map((d, idx) => idx === di ? { ...d, stops: [...d.stops, { destination: '', date: '', activity: '' }] } : d) }))
  const setStop = (di, si, patch) => setPkg((p) => ({ ...p, itinerary: p.itinerary.map((d, idx) => idx === di ? { ...d, stops: d.stops.map((s, sx) => sx === si ? { ...s, ...patch } : s) } : d) }))

  // ---- categories ----
  const addCat = () => setPkg((p) => ({ ...p, categories: [...p.categories, { name: '', description: '', amount: '' }] }))
  const setCat = (i, patch) => setPkg((p) => ({ ...p, categories: p.categories.map((c, idx) => idx === i ? { ...c, ...patch } : c) }))
  const rmCat = (i) => setPkg((p) => ({ ...p, categories: p.categories.filter((_, idx) => idx !== i) }))

  const toggleIncl = (key, item) => setPkg((p) => ({ ...p, [key]: p[key].includes(item) ? p[key].filter((x) => x !== item) : [...p[key], item] }))

  const create = async () => {
    if (!pkg.clientName) { setActive(1); return toast('Client name is required') }
    const payload = {
      ...pkg,
      days: Number(pkg.days), nights: Number(pkg.nights),
      cabs: pkg.cabs.filter((c) => c.cabId).map((c) => ({ ...c, km: Number(c.km), rate: Number(c.rate), total: Number(c.km) * Number(c.rate) })),
      hotelsAlloc: pkg.hotelsAlloc.map((h) => ({ ...h, price: Number(h.price) || 0 })),
      categories: pkg.categories.filter((c) => c.name).map((c) => ({ ...c, amount: Number(c.amount) || 0 })),
      pricing: { ...pkg.pricing, packageCost: Number(pkg.pricing.packageCost) || 0, childCost: Number(pkg.pricing.childCost) || 0, discount: Number(pkg.pricing.discount) || 0, gstPercent: Number(pkg.pricing.gstPercent) || 0, hotelTotal: live.hotelTotal, cabTotal: live.cabTotal, otherTotal: live.otherTotal },
    }
    try {
      if (editing) { await updatePackage(editing.id, payload); toast('Package updated successfully'); nav(`/app/packages/${editing.id}`); return }
      const rec = await addPackage(payload)
      toast('Package created successfully')
      nav(`/app/packages/${rec.id}`)
    } catch (ex) { toast(ex.message || 'Could not save the package') }
  }
  const addCatGroup = (g) => setPkg((p) => ({ ...p, categories: [...p.categories, { name: g, description: '', amount: '' }] }))

  const next = () => setActive((a) => Math.min(10, a + 1))

  return (
    <div>
      <PageHeader title={editing ? `Edit Package · ${editing.code}` : 'Package Creation Wizard'} subtitle="Create a comprehensive travel package with detailed itinerary and pricing." counter="Packages 1 / 20" />

      <div className="wizard">
        {SECTIONS.map((s) => {
          const open = active === s.n
          return (
            <div className="wiz-section" key={s.n}>
              <div className={`sec-banner ${open ? 'sec-active' : 'sec-idle'}`} onClick={() => setActive(open ? 0 : s.n)}>
                <div className="row gap-sm">
                  <span className="sec-icon">{s.icon}</span>
                  <div><div className="sec-title">Section {s.n}: {s.title}</div><div className="sec-sub">{s.sub}</div></div>
                </div>
                <Badge tone={s.tone}>{s.tag}</Badge>
              </div>

              {open && (
                <Card className="wiz-body">
                  {/* ---------- 1. Client ---------- */}
                  {s.key === 'client' && <>
                    <div className="form-grid">
                      <Field label="Client (Optional)">
                        <Select value={pkg.clientId} onChange={(e) => { const c = clients.find((x) => x.id === e.target.value); upd({ clientId: e.target.value, clientName: c?.name || '', clientPhone: c?.phone || '', clientEmail: c?.email || '', clientAddress: c?.address || '' }) }}>
                          <option value="">Select existing client</option>
                          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.code}</option>)}
                        </Select>
                      </Field>
                      <Field label="Client Name" required><Input value={pkg.clientName} onChange={(e) => upd({ clientName: e.target.value })} /></Field>
                      <Field label="Client Phone" required hint="Enter 10-15 digit phone number"><Input value={pkg.clientPhone} onChange={(e) => upd({ clientPhone: e.target.value })} /></Field>
                      <Field label="Client Email"><Input value={pkg.clientEmail} onChange={(e) => upd({ clientEmail: e.target.value })} /></Field>
                      <Field label="Client Address" full><Input value={pkg.clientAddress} onChange={(e) => upd({ clientAddress: e.target.value })} /></Field>
                    </div>
                    <div className="row-between mt-base"><span className="t-title-sm">Pax Details</span>
                      <label className="row gap-xs t-body-sm c-body"><input type="checkbox" checked={pkg.pax.auto} onChange={(e) => upd({ pax: { ...pkg.pax, auto: e.target.checked } })} /> Auto-calculate Total Pax & Rooms</label>
                    </div>
                    <div className="form-grid-3 mt-xs">
                      <Field label="Total Pax"><Input value={pkg.pax.total} onChange={(e) => upd({ pax: { ...pkg.pax, total: e.target.value } })} /></Field>
                      <Field label="Adults"><Input value={pkg.pax.adults} onChange={(e) => upd({ pax: { ...pkg.pax, adults: e.target.value } })} /></Field>
                      <Field label="Children"><Input value={pkg.pax.children} onChange={(e) => upd({ pax: { ...pkg.pax, children: e.target.value } })} /></Field>
                      <Field label="Children Without Bed"><Input value={pkg.pax.childrenNoBed} onChange={(e) => upd({ pax: { ...pkg.pax, childrenNoBed: e.target.value } })} /></Field>
                      <Field label="Extra Beds"><Input value={pkg.pax.extraBeds} onChange={(e) => upd({ pax: { ...pkg.pax, extraBeds: e.target.value } })} /></Field>
                      <Field label="Rooms Required"><Input value={pkg.pax.rooms} onChange={(e) => upd({ pax: { ...pkg.pax, rooms: e.target.value } })} /></Field>
                    </div>
                    <NextBtn onClick={next} label="Travel Basics" />
                  </>}

                  {/* ---------- 2. Travel basics ---------- */}
                  {s.key === 'basics' && <>
                    <div className="form-grid-3">
                      <Field label="Destination" required>
                        <Select value={pkg.destination} onChange={(e) => upd({ destination: e.target.value })}>
                          <option value="">Select destination</option>
                          {destinations.map((d) => <option key={d.id} value={`${d.name} - ${d.location}`}>{d.name} — {d.location}</option>)}
                        </Select>
                      </Field>
                      <Field label="From Location"><Input value={pkg.fromLocation} onChange={(e) => upd({ fromLocation: e.target.value })} placeholder="e.g. Delhi" /></Field>
                      <Field label="Days"><Input value={pkg.days} onChange={(e) => setDays(e.target.value)} /></Field>
                      <Field label="Nights"><Input value={pkg.nights} onChange={(e) => upd({ nights: e.target.value })} disabled={pkg.autoNights} /></Field>
                      <Field label="Start Date"><Input type="date" value={pkg.startDate} onChange={(e) => upd({ startDate: e.target.value })} /></Field>
                    </div>
                    <label className="row gap-xs t-body-sm c-body mt-xs"><input type="checkbox" checked={pkg.autoNights} onChange={(e) => { upd({ autoNights: e.target.checked }); setDays(pkg.days) }} /> Auto-calculate Nights (Nights = Days − 1)</label>
                    <NextBtn onClick={next} label="Flight Section" />
                  </>}

                  {/* ---------- 3. Flight ---------- */}
                  {s.key === 'flight' && <>
                    <Field label="Flight Included?">
                      <Radio value={pkg.flightIncluded} onChange={(v) => upd({ flightIncluded: v })} />
                    </Field>
                    {pkg.flightIncluded && (
                      <div className="form-grid mt-sm">
                        <Field label="Airline"><Input value={pkg.flight?.airline || ''} onChange={(e) => upd({ flight: { ...pkg.flight, airline: e.target.value } })} placeholder="e.g. IndiGo" /></Field>
                        <Field label="Flight No."><Input value={pkg.flight?.flightNo || ''} onChange={(e) => upd({ flight: { ...pkg.flight, flightNo: e.target.value } })} placeholder="6E-2031" /></Field>
                        <Field label="Departure"><Input value={pkg.flight?.depart || ''} onChange={(e) => upd({ flight: { ...pkg.flight, depart: e.target.value } })} placeholder="DEL 06:30" /></Field>
                        <Field label="Arrival"><Input value={pkg.flight?.arrive || ''} onChange={(e) => upd({ flight: { ...pkg.flight, arrive: e.target.value } })} placeholder="SXR 07:50" /></Field>
                      </div>
                    )}
                    <NextBtn onClick={next} label="Itinerary Meta" />
                  </>}

                  {/* ---------- 4. Meta ---------- */}
                  {s.key === 'meta' && <>
                    <div className="form-grid">
                      <Field label="Status"><Select value={pkg.status} onChange={(e) => upd({ status: e.target.value })}><option>Draft</option><option>Quoted</option><option>Confirmed</option><option>Cancelled</option><option>Completed</option></Select></Field>
                      <Field label="Route / Sector"><Input value={pkg.route} onChange={(e) => upd({ route: e.target.value })} placeholder="e.g. DEL-SXR-DEL" /></Field>
                    </div>
                    <NextBtn onClick={next} label="Cab Section" />
                  </>}

                  {/* ---------- 5. Cab ---------- */}
                  {s.key === 'cab' && <>
                    <Field label="Cab Included?"><Radio value={pkg.cabIncluded} onChange={(v) => upd({ cabIncluded: v })} /></Field>
                    {pkg.cabIncluded && <>
                      {pkg.cabs.map((c, i) => (
                        <div className="alloc-row cab-row" key={i}>
                          <Field label="Cab"><Select value={c.cabId} onChange={(e) => pickCab(i, e.target.value)}><option value="">Select cab</option>{cabs.map((x) => <option key={x.id} value={x.id}>{x.name} — {x.type} (Cap {x.capacity})</option>)}</Select></Field>
                          <Field label="Cab Type"><Input value={c.type} readOnly /></Field>
                          <Field label="KMs Travel"><Input value={c.km} onChange={(e) => setCab(i, { km: e.target.value })} /></Field>
                          <Field label="Rate / KM"><Input value={c.rate} onChange={(e) => setCab(i, { rate: e.target.value })} /></Field>
                          <Field label="Total"><Input value={inr((Number(c.km) || 0) * (Number(c.rate) || 0))} readOnly /></Field>
                          <Button variant="danger" size="sm" onClick={() => rmCab(i)}>Remove</Button>
                        </div>
                      ))}
                      <Button variant="secondary" size="sm" onClick={addCabRow}>+ Add Cab</Button>
                    </>}
                    <NextBtn onClick={next} label="Hotel Allocation" />
                  </>}

                  {/* ---------- 6. Hotel ---------- */}
                  {s.key === 'hotel' && <>
                    <Field label="Hotel Included?"><Radio value={pkg.hotelIncluded} onChange={(v) => { upd({ hotelIncluded: v }); if (v) setDays(pkg.days) }} /></Field>
                    {pkg.hotelIncluded && pkg.hotelsAlloc.length === 0 && <p className="t-body-sm c-muted">Set <strong>Days</strong> in Travel Basics to auto-create night rows.</p>}
                    {pkg.hotelIncluded && pkg.hotelsAlloc.map((h, i) => (
                      <div className="alloc-row hotel-row" key={i}>
                        <Field label={`Night ${i + 1} Hotel`}><Select value={h.hotelId} onChange={(e) => pickHotel(i, e.target.value)}><option value="">Select hotel</option>{hotels.map((x) => <option key={x.id} value={x.id}>{x.name} — {x.city}</option>)}</Select></Field>
                        <Field label="Room Type"><Input value={h.roomType} onChange={(e) => setHotel(i, { roomType: e.target.value })} /></Field>
                        <Field label="Price per Night" hint={h.net ? `Net Cost: ${inr(h.net)}/Night` : ''}><Input value={h.price} onChange={(e) => setHotel(i, { price: e.target.value })} placeholder="Selling price" /></Field>
                      </div>
                    ))}
                    <NextBtn onClick={next} label="Day-wise Itinerary" />
                  </>}

                  {/* ---------- 7. Day-wise ---------- */}
                  {s.key === 'days' && <>
                    {pkg.itinerary.map((d, i) => (
                      <div className="day-card" key={i}>
                        <div className="row-between"><span className="t-title-sm">Day {i + 1}</span>
                          <div className="row gap-xs"><Button variant="secondary" size="sm" onClick={() => addStop(i)}>+ Add Destination</Button>{pkg.itinerary.length > 1 && <Button variant="danger" size="sm" onClick={() => rmDay(i)}>Remove</Button>}</div>
                        </div>
                        <div className="form-grid-3 mt-sm">
                          <Field label="Day Title"><Input value={d.title} onChange={(e) => setDay(i, { title: e.target.value })} placeholder="e.g. Arrival & Check-in" /></Field>
                          <Field label="Select Template"><Select value={d.template} onChange={(e) => pickTemplate(i, e.target.value)}><option value="">Select template</option>{templates.map((t) => <option key={t.id}>{t.name}</option>)}</Select></Field>
                          <Field label="Meal Plan"><Input value={d.mealPlan} onChange={(e) => setDay(i, { mealPlan: e.target.value })} placeholder="e.g. Breakfast, Dinner" /></Field>
                        </div>
                        {d.stops.map((st, si) => (
                          <div className="form-grid-3 stop-row" key={si}>
                            <Field label="Destination"><Select value={st.destination} onChange={(e) => setStop(i, si, { destination: e.target.value })}><option value="">Select destination</option>{destinations.map((x) => <option key={x.id}>{x.name}</option>)}</Select></Field>
                            <Field label="Date"><Input type="date" value={st.date} onChange={(e) => setStop(i, si, { date: e.target.value })} /></Field>
                            <Field label="Activity"><Input value={st.activity} onChange={(e) => setStop(i, si, { activity: e.target.value })} placeholder="e.g. Sightseeing, Shopping" /></Field>
                          </div>
                        ))}
                        <Field label="Description" full><Textarea value={d.description} onChange={(e) => setDay(i, { description: e.target.value })} /></Field>
                        <div className="form-grid">
                          <Field label="Activities"><Textarea value={d.activities} onChange={(e) => setDay(i, { activities: e.target.value })} /></Field>
                          <Field label="Travel Details"><Textarea value={d.travel} onChange={(e) => setDay(i, { travel: e.target.value })} placeholder="e.g. Airport → Hotel by private cab" /></Field>
                        </div>
                      </div>
                    ))}
                    <Button variant="secondary" size="sm" onClick={addDay}>+ Add Day</Button>
                    <NextBtn onClick={next} label="Inclusions / Exclusions" />
                  </>}

                  {/* ---------- 8. Inclusions ---------- */}
                  {s.key === 'incl' && <>
                    <div className="form-grid">
                      <div>
                        <div className="t-title-sm mb-sm">Inclusions</div>
                        {(inclusionPresets.inclusions || []).map((x) => (
                          <label className="check-line" key={x}><input type="checkbox" checked={pkg.inclusions.includes(x)} onChange={() => toggleIncl('inclusions', x)} /> {x}</label>
                        ))}
                      </div>
                      <div>
                        <div className="t-title-sm mb-sm">Exclusions</div>
                        {(inclusionPresets.exclusions || []).map((x) => (
                          <label className="check-line" key={x}><input type="checkbox" checked={pkg.exclusions.includes(x)} onChange={() => toggleIncl('exclusions', x)} /> {x}</label>
                        ))}
                      </div>
                    </div>
                    <NextBtn onClick={next} label="Other Categories" />
                  </>}

                  {/* ---------- 9. Categories ---------- */}
                  {s.key === 'cats' && <>
                    <div className="t-body-sm c-body mb-sm">Quick-add a category group:</div>
                    <div className="row wrap gap-xs mb-base">
                      {categoryGroups.map((g) => <button key={g} className="badge badge-neutral" style={{ cursor: 'pointer' }} onClick={() => addCatGroup(g)}>+ {g}</button>)}
                    </div>
                    <Button variant="secondary" size="sm" onClick={addCat}>+ Add Custom Category</Button>
                    {pkg.categories.map((c, i) => (
                      <div className="alloc-row cat-row mt-sm" key={i}>
                        <Field label="Name"><Input value={c.name} onChange={(e) => setCat(i, { name: e.target.value })} placeholder="e.g. Gondola ride" /></Field>
                        <Field label="Description"><Input value={c.description} onChange={(e) => setCat(i, { description: e.target.value })} /></Field>
                        <Field label="Amount (₹)"><Input value={c.amount} onChange={(e) => setCat(i, { amount: e.target.value })} /></Field>
                        <Button variant="danger" size="sm" onClick={() => rmCat(i)}></Button>
                      </div>
                    ))}
                    <NextBtn onClick={next} label="Pricing & Quotation" />
                  </>}

                  {/* ---------- 10. Pricing ---------- */}
                  {s.key === 'pricing' && <>
                    <Field label="Pricing Mode">
                      <div className="row gap-base">
                        {['Per Person', 'Total'].map((m) => (
                          <label className="row gap-xs t-body-sm" key={m}><input type="radio" checked={pkg.pricing.mode === m} onChange={() => updPricing('mode', m)} /> {m}</label>
                        ))}
                      </div>
                    </Field>
                    <div className="form-grid-3 mt-sm">
                      <Field label="Package Cost (₹)"><Input value={pkg.pricing.packageCost} onChange={(e) => updPricing('packageCost', e.target.value)} /></Field>
                      <Field label="Child Cost (₹)"><Input value={pkg.pricing.childCost} onChange={(e) => updPricing('childCost', e.target.value)} /></Field>
                      <Field label="Discount (₹)"><Input value={pkg.pricing.discount} onChange={(e) => updPricing('discount', e.target.value)} /></Field>
                      <Field label="GST (%)"><Input value={pkg.pricing.gstPercent} onChange={(e) => updPricing('gstPercent', e.target.value)} /></Field>
                      <Field label="Grand Total" hint="Auto-calculated including GST"><Input value={inr(live.grandTotal)} readOnly /></Field>
                    </div>
                    <div className="form-grid-3 mt-xs">
                      <Field label="Hotel Total" hint="Auto from hotel allocations"><Input value={inr(live.hotelTotal)} readOnly /></Field>
                      <Field label="Cab Total" hint="Auto from cab allocations"><Input value={inr(live.cabTotal)} readOnly /></Field>
                      <Field label="Other Total" hint="Auto from categories"><Input value={inr(live.otherTotal)} readOnly /></Field>
                    </div>
                    <div className="row gap-sm mt-lg">
                      <Button variant="secondary" onClick={() => nav('/app/packages')}>Cancel</Button>
                      <Button onClick={create}>✓ {editing ? 'Update Package' : 'Create Package'}</Button>
                    </div>
                  </>}
                </Card>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NextBtn({ onClick, label }) {
  return <div className="row" style={{ justifyContent: 'flex-end', marginTop: 20 }}><Button onClick={onClick}>Next: {label} →</Button></div>
}
function Radio({ value, onChange }) {
  return (
    <div className="row gap-base">
      <label className="row gap-xs t-body-sm"><input type="radio" checked={value === true} onChange={() => onChange(true)} /> Yes</label>
      <label className="row gap-xs t-body-sm"><input type="radio" checked={value === false} onChange={() => onChange(false)} /> No</label>
    </div>
  )
}
