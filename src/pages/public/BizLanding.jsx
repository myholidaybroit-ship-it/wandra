import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import './landing-site.css'

/* ============================================================
   Business landing page — lead capture site built in the
   Landing Page builder. Public at /site/:slug.
   Section components are shared with the builder's live preview.
   ============================================================ */

export function LandingHeader({ cfg, agency, accent, onCta }) {
  return (
    <header className="ls-head">
      <div className="ls-head-inner">
        <div className="ls-head-brand">
          {(cfg.logo || agency.logo) && <img src={cfg.logo || agency.logo} alt="" className="ls-head-logo" />}
          <span className="ls-head-name">{cfg.name || agency.name}</span>
        </div>
        <button className="ls-head-cta" style={{ background: accent }} onClick={onCta}>{cfg.ctaText || 'Enquire now'}</button>
      </div>
    </header>
  )
}

export function LandingHero({ cfg, accent, agency, onCta }) {
  return (
    <section className="ls-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(8,9,14,.35), rgba(8,9,14,.62)), url("${cfg.image}")` }}>
      <div className="ls-hero-inner">
        <span className="ls-hero-brand">{agency.name}</span>
        <h1 className="ls-hero-h1">{cfg.heading}</h1>
        <p className="ls-hero-sub">{cfg.sub}</p>
        <button className="ls-cta" style={{ background: accent }} onClick={onCta}>{cfg.ctaText || 'Plan my trip'}</button>
      </div>
    </section>
  )
}

export function LandingAbout({ cfg, accent }) {
  return (
    <section className="ls-about">
      <div className="ls-about-inner">
        <div className="ls-about-img" style={{ backgroundImage: `url("${cfg.image}")` }} />
        <div className="ls-about-body">
          <h2 className="ls-h2">{cfg.title}</h2>
          <p className="ls-about-p">{cfg.body}</p>
          <div className="ls-points">
            {(cfg.points || []).filter(Boolean).map((p, i) => (
              <div className="ls-point" key={i}><span className="ls-point-dot" style={{ background: accent }} />{p}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- custom calendar (native date input looks off-brand) ---------- */
function LandingDatePicker({ value, onChange, accent }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState({ y: 2026, m: 6 })
  const openCal = () => {
    const d = value ? new Date(value + 'T00:00:00') : new Date()
    setView({ y: d.getFullYear(), m: d.getMonth() })
    setOpen((o) => !o)
  }
  const fmt = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  const startOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7 // Monday first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const iso = (d) => `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const nav = (n) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const monthName = new Date(view.y, view.m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="ls-cal-wrap">
      <button type="button" className={`ls-cal-input ${value ? '' : 'empty'}`} onClick={openCal}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
        {fmt || 'Select date'}
      </button>
      {open && <>
        <div className="ls-cal-scrim" onClick={() => setOpen(false)} />
        <div className="ls-cal">
          <div className="ls-cal-head">
            <button type="button" className="ls-cal-nav" onClick={() => nav(-1)}>‹</button>
            <span className="ls-cal-month">{monthName}</span>
            <button type="button" className="ls-cal-nav" onClick={() => nav(1)}>›</button>
          </div>
          <div className="ls-cal-grid">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d} className="ls-cal-dow">{d}</span>)}
            {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
              <button type="button" key={i}
                className={`ls-cal-day ${value === iso(d) ? 'on' : ''} ${todayIso === iso(d) ? 'today' : ''}`}
                style={value === iso(d) ? { background: accent } : undefined}
                onClick={() => { onChange(iso(d)); setOpen(false) }}>{d}</button>
            ))}
          </div>
          <div className="ls-cal-foot">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }}>Clear</button>
            <button type="button" style={{ color: accent }} onClick={() => { onChange(todayIso); setOpen(false) }}>Today</button>
          </div>
        </div>
      </>}
    </div>
  )
}

export function LandingForm({ cfg, accent, onSubmit, state }) {
  const fx = cfg.fields || {}
  const [f, setF] = useState({ name: '', phone: '', email: '', adults: '', children: '', childAges: [], fromCity: '', destination: '', startDate: '', days: '', comments: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const setChildren = (e) => {
    const n = Math.max(0, Math.min(10, Number(e.target.value) || 0))
    setF((p) => ({ ...p, children: e.target.value, childAges: Array.from({ length: n }, (_, i) => p.childAges[i] || '') }))
  }
  const setAge = (i, v) => setF((p) => ({ ...p, childAges: p.childAges.map((a, x) => (x === i ? v : a)) }))

  const submit = () => {
    if (!f.name.trim()) return setErr('Please enter your name.')
    const digits = f.phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) return setErr('Please enter a valid phone number (10–15 digits).')
    // children's ages are mandatory once children are travelling
    if (Number(f.children) > 0 && f.childAges.some((a) => !a || Number(a) < 1 || Number(a) > 17)) {
      return setErr('Please enter each child’s age (1–17 years).')
    }
    setErr('')
    onSubmit({ ...f, phone: digits })
  }

  if (state === 'done') {
    return (
      <section className="ls-form">
        <div className="ls-form-card ls-success">
          <span className="ls-success-ic" style={{ background: accent }}>✓</span>
          <h2 className="ls-h2">Enquiry received</h2>
          <p className="ls-form-sub">{cfg.successMsg}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="ls-form">
      <div className="ls-form-card">
        <h2 className="ls-h2">{cfg.title}</h2>
        {cfg.sub && <p className="ls-form-sub">{cfg.sub}</p>}

        <div className="ls-grid">
          <label className="ls-field wide"><span>Name <em>*</em></span><input value={f.name} onChange={set('name')} placeholder="Mr Kumar" /></label>
          {fx.adults !== false && <label className="ls-field"><span>No. of Adults</span><input type="number" min="0" value={f.adults} onChange={set('adults')} placeholder="4" /></label>}
          {fx.children !== false && <label className="ls-field"><span>Children</span><input type="number" min="0" max="10" value={f.children} onChange={setChildren} placeholder="2" /></label>}
        </div>
        {Number(f.children) > 0 && (
          <div className="ls-ages">
            <span className="ls-ages-k">Children’s ages <em>*</em></span>
            <div className="ls-ages-row">
              {f.childAges.map((a, i) => (
                <label className="ls-age" key={i}>
                  <span>Child {i + 1}</span>
                  <input type="number" min="1" max="17" value={a} onChange={(e) => setAge(i, e.target.value)} placeholder="yrs" />
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="ls-grid two">
          <label className="ls-field wide"><span>Phone Number <em>*</em></span><input inputMode="numeric" value={f.phone} onChange={set('phone')} placeholder="e.g. 8888888888" /></label>
          {fx.email !== false && <label className="ls-field wide"><span>Email</span><input type="email" value={f.email} onChange={set('email')} placeholder="e.g. name@example.com" /></label>}
        </div>
        <div className="ls-grid two">
          {fx.fromCity !== false && <label className="ls-field wide"><span>Travelling from</span><input value={f.fromCity} onChange={set('fromCity')} placeholder="e.g. Delhi" /></label>}
          {fx.destination !== false && <label className="ls-field wide"><span>Destination</span><input value={f.destination} onChange={set('destination')} placeholder="e.g. Srinagar" /></label>}
        </div>
        <div className="ls-grid two">
          {fx.startDate !== false && (
            <div className="ls-field wide">
              <span>Start Date</span>
              <LandingDatePicker value={f.startDate} accent={accent} onChange={(v) => setF((p) => ({ ...p, startDate: v }))} />
            </div>
          )}
          {fx.days !== false && <label className="ls-field wide"><span>No. of Days</span><input type="number" min="1" value={f.days} onChange={set('days')} placeholder="e.g. 4" /></label>}
        </div>
        {fx.comments !== false && (
          <label className="ls-field full"><span>Requirements / Comments</span>
            <textarea rows={3} value={f.comments} onChange={set('comments')} placeholder="e.g. 5 Days / 4 Star Hotel / 25,000 Budget" />
          </label>
        )}

        {err && <div className="ls-err">{err}</div>}
        <button className="ls-submit" style={{ background: accent }} onClick={submit} disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : (cfg.buttonText || 'Send Enquiry')}
        </button>
      </div>
    </section>
  )
}

export function LandingFooter({ agency }) {
  return (
    <footer className="ls-foot">
      <div className="ls-foot-inner">
        <span className="ls-foot-brand">{agency.name}</span>
        <span>{[agency.phone, agency.email].filter(Boolean).join(' · ')}</span>
        <span className="ls-powered">Powered by <strong>Wandra</strong></span>
      </div>
    </footer>
  )
}

/* renders the configured sections in their saved order */
export function LandingRender({ landing, agency, onSubmit, state, formRef }) {
  const accent = landing.accent || '#111113'
  const scrollToForm = () => formRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const sections = {
    hero: landing.hero.enabled && <LandingHero key="hero" cfg={landing.hero} accent={accent} agency={agency} onCta={scrollToForm} />,
    about: landing.about.enabled && <LandingAbout key="about" cfg={landing.about} accent={accent} />,
    form: landing.form.enabled && (
      <div key="form" ref={formRef}>
        <LandingForm cfg={landing.form} accent={accent} onSubmit={onSubmit} state={state} />
      </div>
    ),
  }
  return <>
    {landing.header?.enabled && <LandingHeader cfg={landing.header} agency={agency} accent={accent} onCta={scrollToForm} />}
    {(landing.order || ['hero', 'about', 'form']).map((k) => sections[k])}
  </>
}

export default function BizLanding() {
  const { slug } = useParams()
  const { landing, agency, addClient } = useApp()
  const [state, setState] = useState('idle')
  const formRef = useRef(null)

  if (!landing.published || slug !== landing.slug) {
    return <div className="ls-missing">This page isn’t live. <a href="/">Home</a></div>
  }

  const onSubmit = (f) => {
    setState('sending')
    const days = Number(f.days) || 0
    addClient({
      name: f.name.trim(),
      email: f.email || '',
      phone: f.phone,
      city: f.fromCity?.trim() || '',
      interest: f.destination?.trim() || 'General Inquiry',
      source: 'Landing Page',
      note: f.comments || 'Landing page enquiry',
      budget: 0,
      query: {
        refId: Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase().padEnd(6, '7'),
        // assignee intentionally omitted — the assignment rules engine routes the lead
        startDate: f.startDate || '',
        nights: days > 0 ? Math.max(1, days - 1) : 0,
        adults: Number(f.adults) || 0,
        children: Number(f.children) || 0,
        childAges: (f.childAges || []).filter(Boolean),
      },
    })
    setTimeout(() => setState('done'), 500)
  }

  return (
    <div className="ls">
      <LandingRender landing={landing} agency={agency} onSubmit={onSubmit} state={state} formRef={formRef} />
      <LandingFooter agency={agency} />
    </div>
  )
}
