import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { publicApi } from '../../api'
import { Button, Card, Badge, Modal, Field, Input, Textarea } from '../../components/ui/UI'
import './landing.css'

const ROTATE = ['Modern Travel Agencies', 'Going Paperless', 'Itineraries in Seconds', 'Zero-Leaked Leads', 'GST-Ready Invoicing']

const PRODUCTS = [
  { tone: 'coral', glyph: '✦', name: 'Packages', tagline: 'Build day-by-day trips with live profit margins baked in.', badge: 'NEW', to: '/app/packages' },
  { tone: 'blue', glyph: '⌖', name: 'Itineraries', tagline: 'Six shareable themes your clients will actually read.', to: '/i/PKG-202602-0003' },
  { tone: 'purple', glyph: '₹', name: 'Invoices', tagline: 'GST & non-GST billing with partial-payment tracking.', to: '/app/invoices' },
  { tone: 'magenta', glyph: '◉', name: 'CRM', tagline: 'Every lead captured, scored and followed up — never leaked.', to: '/app/clients' },
]

const TILES = [
  { icon: '⌂', title: 'Hotels & Inventory', body: 'Your affiliated hotels with buying prices, so every quote knows its margin.' },
  { icon: '', title: 'Cabs & Transfers', body: 'Rate-per-km fleets and day-wise transfer plans, auto-costed.' },
  { icon: '◈', title: 'Vouchers', body: 'Hotel, cab and flight vouchers generated straight from the booking.' },
  { icon: '❖', title: 'Gallery & Stories', body: 'Collect traveler photos and testimonials into a shareable wall.' },
]

const FEATURES = [
  { icon: '✦', title: 'Itinerary builder', body: 'Turn an inquiry into a beautiful day-by-day itinerary in minutes — 6 ready-made themes.' },
  { icon: '₹', title: 'GST & non-GST invoices', body: 'Item-wise or full invoices, partial payment tracking, balances and payment history.' },
  { icon: '◉', title: 'Built-in CRM', body: 'Capture leads from ads & forms, track lead temperature, interest and budget.' },
  { icon: '⌂', title: 'Hotels, cabs & destinations', body: 'Your affiliated inventory with buying prices — so every quote calculates profit.' },
  { icon: '◔', title: 'Reports & profit', body: 'See total value, components cost and margin per booking, client and package.' },
  { icon: '❖', title: 'Portfolio & testimonials', body: 'Collect traveler stories with photos and publish a shareable gallery wall.' },
]

const STATS = [
  { num: '480+', label: 'Agencies onboarded' },
  { num: '12,000+', label: 'Itineraries generated' },
  { num: '₹9.4 Cr', label: 'Invoiced through Wandra' },
  { num: '6', label: 'Itinerary themes' },
]

const STEPS = ['Capture lead', 'Build package', 'Send itinerary', 'Confirm booking', 'Invoice & collect', 'Collect reviews']

export default function Landing() {
  const [idx, setIdx] = useState(0)
  const [sp, setSp] = useSearchParams()
  const [trialOpen, setTrialOpen] = useState(false)
  const [trialDone, setTrialDone] = useState(false)
  const [trialErr, setTrialErr] = useState('')
  const [trial, setTrial] = useState({ name: '', agencyName: '', phone: '', email: '', city: '', website: '', teamSize: '', note: '' })
  const trialQuery = sp.get('trial')
  useEffect(() => { const t = setInterval(() => setIdx((i) => (i + 1) % ROTATE.length), 2200); return () => clearInterval(t) }, [])
  const setTrialField = (k) => (e) => setTrial({ ...trial, [k]: e.target.value })
  const openTrial = () => { setTrialOpen(true); setTrialDone(false); setTrialErr('') }
  const closeTrial = () => {
    setTrialOpen(false)
    if (trialQuery) setSp({}, { replace: true })
  }
  useEffect(() => {
    if (trialQuery === '1') openTrial()
  }, [trialQuery])
  const submitTrial = async () => {
    if (!trial.name.trim() || !trial.agencyName.trim() || !trial.phone.trim()) return setTrialErr('Name, agency name and phone are required')
    try {
      await publicApi.post('/trial', trial)
      setTrialDone(true)
    } catch (ex) { setTrialErr(ex.message || 'Could not send trial request') }
  }

  return (
    <div className="landing">
      {/* HERO BAND */}
      <section className="hero">
        <div className="hero-inner">
          <Badge tone="new">NEW · AI Itinerary Builder</Badge>
          <h1 className="t-hero-display hero-h1">
            The Operating System<br />for <span className="rotate">{ROTATE[idx]}</span>
          </h1>
          <p className="hero-sub t-subtitle">
            Run your entire travel agency from a single, clear dashboard. Replace spreadsheets,
            WhatsApp threads and scattered tools with one connected system.
          </p>
          <div className="row gap-sm hero-cta wrap">
            <Button size="lg" onClick={openTrial}>Start Free Trial</Button>
            <Link to="/i/PKG-202602-0003"><Button variant="secondary" size="lg">See a sample itinerary</Button></Link>
          </div>
        </div>
      </section>

      {/* PRODUCT MATRIX — vibrant identity cards */}
      <section id="product" className="product-matrix-section">
        <div className="product-matrix-inner">
          <div className="product-matrix">
            {PRODUCTS.map((p) => (
              <div key={p.name} className={`product-card product-card-${p.tone}`}>
                {p.badge && <span className="pc-badge"><Badge tone="new">{p.badge}</Badge></span>}
                <span className="pc-glyph">{p.glyph}</span>
                <div className="pc-wordmark">{p.name}</div>
                <p className="pc-tagline">{p.tagline}</p>
                <div className="pc-cta">
                  <Link to={p.to}><Button size="sm" variant="tertiary">Explore →</Button></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORTING MODULES — white tile matrix */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-inner">
          <div className="text-center">
            <div className="section-eyebrow">The full stack</div>
            <h2 className="t-heading-md mt-xs">Every moving part of your agency, connected</h2>
          </div>
          <div className="tile-matrix mt-xl">
            {TILES.map((t) => (
              <div key={t.title} className="ai-tile">
                <div className="ai-tile-art">{t.icon}</div>
                <div className="ai-tile-title">{t.title}</div>
                <p className="ai-tile-body">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="section section-soft">
        <div className="section-inner">
          <div className="stat-row">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section">
        <div className="section-inner">
          <div className="text-center">
            <div className="section-eyebrow">Everything in one place</div>
            <h2 className="t-heading-lg mt-xs">One connected system for your whole agency</h2>
          </div>
          <div className="grid grid-3 mt-xl">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <div className="feat-icon">{f.icon}</div>
                <div className="t-card-title mt-sm">{f.title}</div>
                <p className="t-body-sm c-steel mt-xs">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="section section-soft">
        <div className="section-inner">
          <h2 className="t-heading-lg text-center">From inquiry to invoice — paperless</h2>
          <div className="workflow mt-xl">
            {STEPS.map((s, i) => (
              <div className="wf-step" key={s}>
                <div className="wf-icon">{i + 1}</div>
                <div className="t-body-sm-medium">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="section-inner">
          <div className="text-center">
            <div className="section-eyebrow">Pricing</div>
            <h2 className="t-heading-lg mt-xs">70% off during early access</h2>
          </div>
          <PricingTiers onTrial={openTrial} />
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="section section-soft">
        <div className="section-inner">
          <h2 className="t-heading-lg text-center">Loved by travel agencies</h2>
          <div className="grid grid-3 mt-xl">
            {[['Zahid', 'Kashmir Trails', 'Trip was amazing — perfectly organised from start to finish.'], ['Aamir', 'Valley Voyages', 'Cut our itinerary time from hours to minutes. Clients love the look.'], ['Sana', 'Peak Escapes', 'Invoices, vouchers and reviews in one place. Game changer.']].map(([n, co, q]) => (
              <Card key={n}>
                <div className="review-stars">★★★★★</div>
                <p className="t-body-md mt-sm">“{q}”</p>
                <div className="row gap-sm mt-base">
                  <span className="review-avatar">{n[0]}</span>
                  <div>
                    <div className="t-body-sm-medium">{n}</div>
                    <div className="t-micro c-muted">{co}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO CTA — coral strip */}
      <section className="section">
        <div className="section-inner">
          <div className="promo-cta-card">
            <h2 className="t-display-lg">Go paperless this week</h2>
            <p className="t-subtitle promo-cta-sub">Start free. Upgrade only when you scale — launch pricing locked for a year.</p>
            <div className="mt-lg"><Button size="lg" onClick={openTrial}>Start Free Trial</Button></div>
          </div>
        </div>
      </section>
      <Modal open={trialOpen} onClose={closeTrial} title={trialDone ? 'Free trial request received' : 'Start Free Trial'} width={620}
        footer={trialDone
          ? <Button onClick={closeTrial}>Close</Button>
          : <><Button variant="tertiary" onClick={closeTrial}>Cancel</Button><Button onClick={submitTrial}>Send Request</Button></>}>
        {trialDone ? (
          <div className="trial-done">
            <div className="feat-icon trial-check">✓</div>
            <p className="t-body-md c-body">Thanks. We have your agency details and will contact you to activate free trial access.</p>
          </div>
        ) : (
          <div className="col gap-base">
            <Field label="Owner name" required><Input value={trial.name} onChange={setTrialField('name')} placeholder="Your name" /></Field>
            <Field label="Agency name" required><Input value={trial.agencyName} onChange={setTrialField('agencyName')} placeholder="e.g. Valley Voyages" /></Field>
            <div className="form-grid">
              <Field label="Phone" required><Input value={trial.phone} onChange={setTrialField('phone')} placeholder="WhatsApp number" /></Field>
              <Field label="Email"><Input value={trial.email} onChange={setTrialField('email')} placeholder="you@agency.com" /></Field>
            </div>
            <div className="form-grid">
              <Field label="City"><Input value={trial.city} onChange={setTrialField('city')} placeholder="e.g. Srinagar" /></Field>
              <Field label="Team size"><Input value={trial.teamSize} onChange={setTrialField('teamSize')} placeholder="e.g. 5" /></Field>
            </div>
            <Field label="Website / Instagram"><Input value={trial.website} onChange={setTrialField('website')} placeholder="Optional" /></Field>
            <Field label="Anything else"><Textarea rows={3} value={trial.note} onChange={setTrialField('note')} placeholder="Tell us what access or setup you need." /></Field>
            {trialErr && <div className="trial-error">{trialErr}</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}

function PricingTiers({ onTrial }) {
  const [yearly, setYearly] = useState(false)
  const tiers = [
    { name: 'Free Trial', monthly: 0, sub: '100 clients / month', perks: ['Itineraries & quotations', '6 themes', 'Shareable links & PDF'], featured: false },
    { name: 'Growth', monthly: 1499, old: '₹4,999', sub: '100 clients / month', perks: ['GST & non-GST invoices', 'Vouchers & payments', 'Reports & profit', 'Team accounts'], featured: true },
    { name: 'Scale', monthly: 3999, old: '₹12,999', sub: '500 clients / month', perks: ['Everything in Growth', 'Lead capture forms', 'Custom branding', 'Priority support'], featured: false },
  ]
  const fmt = (n) => (n === 0 ? 'Free' : `₹${Math.round(yearly ? n * 10 / 12 : n).toLocaleString('en-IN')}`)
  return (
    <>
      <div className="pricing-tabs">
        <div className="tabs">
          <button className={`pill-tab ${!yearly ? 'active' : ''}`} onClick={() => setYearly(false)}>Monthly billing</button>
          <button className={`pill-tab ${yearly ? 'active' : ''}`} onClick={() => setYearly(true)}>Yearly — 2 months free</button>
        </div>
      </div>
      <div className="tier-grid">
        {tiers.map((t) => (
          <Card key={t.name} dark={t.featured} pad={32} className="tier-card">
            <div className="row-between">
              <span className="t-card-title">{t.name}</span>
              {t.featured && <Badge tone="new">Popular</Badge>}
            </div>
            <div className="mt-sm">
              {t.old && !yearly && <span className="tier-old">{t.old}</span>}
              <span className="tier-price">{fmt(t.monthly)}</span>
              {t.monthly > 0 && <span className="tier-per"> / month{yearly ? ', billed yearly' : ''}</span>}
            </div>
            <div className="t-caption c-muted mt-xs">{t.sub}</div>
            <hr className="divider" />
            <ul className="col gap-xs grow">
              {t.perks.map((p) => (
                <li className="tier-perk" key={p} style={{ color: t.featured ? 'var(--color-on-dark-soft)' : 'var(--color-slate)' }}>
                  <span className="tier-check">✓</span>{p}
                </li>
              ))}
            </ul>
            <Button className="w-full mt-lg" variant={t.featured ? 'tertiary' : 'primary'} onClick={onTrial}>Get started</Button>
          </Card>
        ))}
      </div>
    </>
  )
}
