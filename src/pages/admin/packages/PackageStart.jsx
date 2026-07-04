import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../../store/AppContext'
import { Button, Badge } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './packagestart.css'

const TRANSFER_RE = /arriv|depart|transfer|drive|back to|airport|check-?out|pickup|drop/i
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', opts) : ''

export default function PackageStart() {
  const { id } = useParams()
  const nav = useNavigate()
  const { clients, hotels, packageTemplates } = useApp()
  const c = clients.find((x) => x.id === id)

  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')
  const [comments, setComments] = useState([])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const wanted = (c?.interest || '').split(',').map((s) => s.trim()).filter((s) => s && s !== 'General Inquiry')

  const matched = useMemo(() => {
    let list = packageTemplates
    if (!showAll && wanted.length) {
      list = list.filter((t) => wanted.some((w) => {
        const a = w.toLowerCase(), b = t.destination.toLowerCase()
        return a === b || a.includes(b) || b.includes(a)
      }))
    }
    const query = search.trim().toLowerCase()
    if (query) list = list.filter((t) => t.name.toLowerCase().includes(query) || t.destination.toLowerCase().includes(query) || t.id.toLowerCase().includes(query))
    return list
  }, [packageTemplates, wanted.join('|'), showAll, search])

  if (!c) return <div className="pstart-missing">Client not found. <Link className="c-link" to="/app/clients">Back to clients</Link></div>

  const scopeLabel = wanted.length ? wanted.join(', ') : 'this trip'
  const nights = c.query?.nights
  const goManual = () => nav(`/app/packages/new?client=${c.id}`)
  // open the builder pre-filled from the template so the agent can edit before creating
  const useTemplate = (tpl) => nav(`/app/packages/new?client=${c.id}&template=${tpl.id}`)

  const addComment = () => {
    const text = draft.trim(); if (!text) return
    setComments((cs) => [{ id: `${Date.now()}`, text, at: new Date() }, ...cs])
    setDraft(''); setAdding(false)
  }

  return (
    <div className="pstart">
      {/* ---------- Trip header ---------- */}
      <div className="ptrip">
        <div className="ptrip-main">
          <Link to={`/app/clients/${c.id}`} className="ptrip-back"><Icon name="chevron" size={14} className="ptrip-back-ic" /> Back to {c.name}</Link>
          <div className="ptrip-title-row">
            {c.query?.refId && <span className="ptrip-code">#{c.query.refId}</span>}
            <h1 className="ptrip-name">{c.name}</h1>
            {wanted.length > 0 && <span className="ptrip-dest">{wanted.join(' · ')}</span>}
            <Badge>{c.tripStatus}</Badge>
          </div>
          <div className="ptrip-meta">
            {c.query?.startDate && <span className="pm"><Icon name="calendar" size={14} /> {fmtDate(c.query.startDate)}</span>}
            {nights ? <span className="pm"><Icon name="clock" size={14} /> {nights}N / {nights + 1}D</span> : null}
            <span className="pm"><Icon name="clients" size={14} /> {c.query?.adults || 0} Adults{c.query?.children ? ` · ${c.query.children} Children` : ''}</span>
            {c.phone && <span className="pm">{c.phone}</span>}
          </div>
        </div>
        <div className="ptrip-side">
          <div className="ptrip-kv"><span className="ptrip-k">Sales team</span><span className="ptrip-v">{c.query?.assignee || '—'}</span></div>
          <div className="ptrip-kv"><span className="ptrip-k">Source</span><span className="ptrip-v">{c.source || '—'}</span></div>
          {c.budget ? <div className="ptrip-kv"><span className="ptrip-k">Budget</span><span className="ptrip-v">{inr(c.budget)}</span></div> : null}
        </div>
      </div>

      {/* ---------- Suggestions + Tasks ---------- */}
      <div className="pstart-cols">
        <div className="pstart-left">
          <div className="psug-head">
            <h2 className="psug-title">Create a quote — start with a suggestion</h2>
            <p className="psug-sub">Pick a ready-made {scopeLabel} itinerary, tweak it, and share in under a minute.</p>
          </div>

          <div className="psug-toolbar">
            <div className="psug-search">
              <Icon name="search" size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or destination" />
            </div>
            {wanted.length > 0 && (
              <label className="psug-check">
                <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                <span className="psug-check-box"><Icon name="check" size={12} strokeWidth={2.6} /></span>
                <span className="psug-check-label">Show all destinations</span>
              </label>
            )}
            <Button onClick={goManual}><Icon name="wand" size={15} /> Build from scratch</Button>
          </div>

          {matched.length ? (
            <div className="psug-grid">
              {matched.map((t) => <SuggestionCard key={t.id} t={t} hotels={hotels} onUse={() => useTemplate(t)} />)}
            </div>
          ) : (
            <div className="psug-empty">
              <span className="psug-empty-ic"><Icon name="layers" size={22} /></span>
              <div className="psug-empty-title">No suggestions for {scopeLabel} yet</div>
              <p>Build this one from scratch — it becomes a reusable template next time.</p>
              <div className="row gap-sm center">
                <Button onClick={goManual}>Build from scratch</Button>
                {!showAll && <Button variant="tertiary" onClick={() => setShowAll(true)}>Show all destinations</Button>}
              </div>
            </div>
          )}
        </div>

        {/* ---------- Tasks & Comments ---------- */}
        <aside className="ptasks">
          <div className="ptasks-head">
            <span className="ptasks-title">Tasks & Comments</span>
            {!adding && <button className="ptasks-add" onClick={() => setAdding(true)}><Icon name="plus" size={13} /> Add New</button>}
          </div>

          {adding && (
            <div className="ptasks-form">
              <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} placeholder="Add a follow-up, required action or note…" />
              <div className="ptasks-form-acts">
                <Button size="sm" variant="tertiary" onClick={() => { setAdding(false); setDraft('') }}>Cancel</Button>
                <Button size="sm" onClick={addComment}>Add</Button>
              </div>
            </div>
          )}

          {comments.length === 0 && !adding ? (
            <div className="ptasks-empty">
              <span className="ptasks-empty-ic"><Icon name="check" size={18} strokeWidth={2.4} /></span>
              <div className="ptasks-empty-title">All caught up!</div>
              <p>Add comments such as follow-ups or required actions for better trip flow.</p>
            </div>
          ) : (
            <div className="ptasks-list">
              {comments.map((cm) => (
                <div className="ptask" key={cm.id}>
                  <p className="ptask-text">{cm.text}</p>
                  <span className="ptask-time">{cm.at.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ============================ suggestion card ============================ */
function SuggestionCard({ t, hotels, onUse }) {
  const [tab, setTab] = useState('itinerary')
  const cities = useMemo(() => cityNights(t, hotels), [t, hotels])
  const price = useMemo(() => computePricing({ cabs: t.cabs, hotelsAlloc: t.hotelsAlloc, categories: t.categories, pricing: t.pricing }).grandTotal, [t])

  return (
    <div className="scard">
      <div className="scard-head">
        <div className="scard-id">
          <span className="scard-code">{t.id.replace('tpl-', '').toUpperCase()}</span>
          <span className="scard-name">{t.name}</span>
        </div>
        <div className="scard-pills">
          {cities.map((cn, i) => (
            <span className="scard-pill" key={cn.city + i}>{cn.city}<b>{cn.nights}N</b></span>
          ))}
        </div>
      </div>

      <div className="scard-tabs">
        {['itinerary', 'hotels', 'details'].map((k) => (
          <button key={k} className={`scard-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{cap(k)}</button>
        ))}
      </div>

      <div className="scard-body">
        {tab === 'itinerary' && <Itin t={t} />}
        {tab === 'hotels' && <HotelsTab t={t} hotels={hotels} />}
        {tab === 'details' && <DetailsTab t={t} price={price} />}
      </div>

      <div className="scard-foot">
        <div className="scard-price"><span className="scard-from">from</span><span className="scard-amt">{inr(price)}</span></div>
        <button className="scard-use" onClick={onUse}>Use this Quote</button>
      </div>
    </div>
  )
}

function Itin({ t }) {
  return (
    <div className="itin">
      {(t.itinerary || []).map((d) => {
        const kind = TRANSFER_RE.test(d.title) ? 'transfer' : 'tour'
        const acts = (d.activities || '').split(',').map((s) => s.trim()).filter(Boolean)
        return (
          <div className="itin-day" key={d.day}>
            <span className="itin-daypill">Day {d.day}</span>
            <div className="itin-lines">
              <div className={`itin-line ${kind}`}>
                <Icon name={kind === 'transfer' ? 'cabs' : 'destinations'} size={13} className="itin-line-ic" /> {d.title}
              </div>
              {acts.map((a, i) => (
                <div className="itin-line ticket" key={i}><Icon name="star" size={12} className="itin-line-ic" /> {a}</div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HotelsTab({ t, hotels }) {
  const groups = hotelGroups(t, hotels)
  if (groups.length === 0) return <div className="scard-empty">No hotels in this suggestion.</div>
  return (
    <div className="shotels">
      {groups.map((g, i) => (
        <div className="shotel" key={i}>
          <span className="shotel-nights">N{g.from}{g.to !== g.from ? `–${g.to}` : ''}</span>
          <div className="shotel-info">
            <div className="shotel-name">{g.name}</div>
            <div className="shotel-sub">{[g.roomType, g.city, g.star ? `${g.star}★` : ''].filter(Boolean).join(' · ')}</div>
          </div>
          <Icon name="hotels" size={16} className="shotel-ic" />
        </div>
      ))}
    </div>
  )
}

function DetailsTab({ t, price }) {
  return (
    <div className="sdetails">
      <p className="sdet-summary">{t.summary}</p>
      {t.highlights?.length > 0 && <div className="sdet-chips">{t.highlights.map((h) => <span className="sdet-chip" key={h}>{h}</span>)}</div>}
      <div className="sdet-rows">
        <div className="sdet-row"><span>Duration</span><span>{t.nights}N / {t.days}D</span></div>
        <div className="sdet-row"><span>Accommodation</span><span>{t.hotelsAlloc.length} nights</span></div>
        <div className="sdet-row"><span>Transport</span><span>{t.cabs.map((c) => c.name).join(', ') || '—'}</span></div>
        <div className="sdet-row"><span>Add-ons</span><span>{t.categories.map((c) => c.name).join(', ') || '—'}</span></div>
        <div className="sdet-row total"><span>Package price</span><span>{inr(price)}</span></div>
      </div>
      <div className="sdet-tag"><Badge tone="new">{t.tag}</Badge><span className="sdet-uses">{t.usedCount} uses</span></div>
    </div>
  )
}

/* ============================ helpers ============================ */
function cityNights(t, hotels) {
  const order = [], map = {}
  ;(t.hotelsAlloc || []).forEach((h) => {
    const hotel = hotels.find((x) => x.id === h.hotelId)
    const city = hotel?.city || t.destination
    if (!(city in map)) { map[city] = 0; order.push(city) }
    map[city]++
  })
  if (order.length === 0) return [{ city: t.destination, nights: t.nights }]
  return order.map((city) => ({ city, nights: map[city] }))
}

function hotelGroups(t, hotels) {
  const groups = []
  ;(t.hotelsAlloc || []).forEach((h) => {
    const last = groups[groups.length - 1]
    const hotel = hotels.find((x) => x.id === h.hotelId)
    const city = hotel?.city || '', star = hotel?.rating || ''
    if (last && last.name === h.name && last.roomType === h.roomType) last.to = h.night
    else groups.push({ from: h.night, to: h.night, name: h.name, roomType: h.roomType, city, star })
  })
  return groups
}
