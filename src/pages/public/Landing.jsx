import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Badge } from '../../components/ui/UI'
import './landing.css'

const ROTATE = ['Going paperless', 'Modern Travel Agencies', 'Itineraries in Seconds', 'Lead Forms', 'GST & Non-GST Invoices', 'Showcasing Social Proof', 'Zero-Leaked Leads']

const FEATURES = [
  { icon: '✦', title: 'Itinerary builder', body: 'Turn an inquiry into a beautiful day-by-day itinerary in minutes — 6 ready-made themes.' },
  { icon: '₹', title: 'GST & non-GST invoices', body: 'Item-wise or full invoices, partial payment tracking, balances and payment history.' },
  { icon: '◉', title: 'Built-in CRM', body: 'Capture leads from ads & forms, track lead temperature, interest and budget.' },
  { icon: '⌂', title: 'Hotels, cabs & destinations', body: 'Your affiliated inventory with buying prices — so every quote calculates profit.' },
  { icon: '◔', title: 'Reports & profit', body: 'See total value, components cost and margin per booking, client and package.' },
  { icon: '❖', title: 'Portfolio & testimonials', body: 'Collect traveler stories with photos and publish a shareable gallery wall.' },
]
const STEPS = ['Capture lead', 'Build package', 'Send itinerary', 'Confirm booking', 'Invoice & collect', 'Collect reviews']

export default function Landing() {
  const [idx, setIdx] = useState(0)
  useEffect(() => { const t = setInterval(() => setIdx((i) => (i + 1) % ROTATE.length), 2200); return () => clearInterval(t) }, [])

  return (
    <div className="landing">
      {/* HERO */}
      <section className="hero">
        <div className="hero-sky" />
        <div className="hero-inner">
          <Badge tone="preview">New · AI Itinerary Builder</Badge>
          <h1 className="t-display-mega hero-h1">
            The Operating System & CRM<br />for <span className="rotate">{ROTATE[idx]}</span>
          </h1>
          <p className="hero-sub t-body-md c-body">
            Run your entire travel agency from a single, clear dashboard. Replace spreadsheets,
            WhatsApp threads and scattered tools with one connected system.
          </p>
          <div className="row gap-sm center hero-cta">
            <Button as="a" href="/app" size="lg">Start Free Trial</Button>
            <Link to="/i/PKG-202602-0003"><Button variant="secondary" size="lg">See a sample itinerary</Button></Link>
          </div>

          {/* device mockup composite */}
          <div className="device">
            <div className="macbook">
              <div className="mb-bar"><span className="dot r" /><span className="dot y" /><span className="dot g" /></div>
              <div className="mb-screen">
                <div className="mbs-side">
                  {['Dashboard', 'Clients', 'Packages', 'Invoices', 'Reports'].map((x) => <div key={x} className="mbs-link">{x}</div>)}
                </div>
                <div className="mbs-main">
                  <div className="mbs-title">Welcome back, Wandra!</div>
                  <div className="mbs-kpis">
                    {['₹25,000', '3', '3', '2'].map((v, i) => <div className="mbs-kpi" key={i}><span className="mbs-kpi-v">{v}</span></div>)}
                  </div>
                  <div className="mbs-chart" />
                </div>
              </div>
            </div>
            <div className="iphone">
              <div className="ip-notch" />
              <div className="ip-hero" />
              <div className="ip-line w70" /><div className="ip-line w90" /><div className="ip-line w50" />
              <div className="ip-pill">Print / Save PDF</div>
            </div>
            <div className="float-card fc-1"><span className="fc-dot" /> Payment Received ₹85,000</div>
            <div className="float-card fc-2">Itinerary Sent ✓</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section">
        <div className="section-inner">
          <div className="t-caption-upper c-muted text-center">Everything in one place</div>
          <h2 className="t-display-lg text-center mt-xs">One connected system for your whole agency</h2>
          <div className="grid grid-3 mt-xl">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <div className="feat-icon">{f.icon}</div>
                <div className="t-title-md mt-sm">{f.title}</div>
                <p className="t-body-sm c-body mt-xs">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="section section-soft">
        <div className="section-inner">
          <h2 className="t-display-lg text-center">From inquiry to invoice — paperless</h2>
          <div className="workflow mt-xl">
            {STEPS.map((s, i) => (
              <div className="wf-step" key={s}>
                <div className="wf-icon">{i + 1}</div>
                <div className="t-title-sm">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="section">
        <div className="section-inner">
          <div className="t-caption-upper c-muted text-center">Pricing</div>
          <h2 className="t-display-lg text-center mt-xs">70% off during early access</h2>
          <PricingTiers />
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="section section-soft">
        <div className="section-inner">
          <h2 className="t-display-lg text-center">Loved by travel agencies</h2>
          <div className="grid grid-3 mt-xl">
            {[['Zahid', 'Trip was amazing — perfectly organised from start to finish.'], ['Aamir', 'Cut our itinerary time from hours to minutes. Clients love the look.'], ['Sana', 'Invoices, vouchers and reviews in one place. Game changer.']].map(([n, q]) => (
              <Card key={n}>
                <div className="c-warning">★★★★★</div>
                <p className="t-body-md mt-sm">“{q}”</p>
                <div className="t-body-sm c-muted mt-base">— {n}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-band">
        <div className="section-inner text-center">
          <h2 className="t-display-lg">Go paperless this week</h2>
          <p className="t-body-md c-body mt-sm">Start free. Upgrade only when you scale.</p>
          <div className="mt-lg"><Button as="a" href="/app" size="lg">Start Free Trial</Button></div>
        </div>
      </section>
    </div>
  )
}

function PricingTiers() {
  const tiers = [
    { name: 'Free Trial', price: 'Free', sub: '20 clients / month', perks: ['Itineraries & quotations', '6 themes', 'Shareable links & PDF'], featured: false },
    { name: 'Growth', price: '₹1,499', old: '₹4,999', sub: '100 clients / month', perks: ['GST & non-GST invoices', 'Vouchers & payments', 'Reports & profit', 'Team accounts'], featured: true },
    { name: 'Scale', price: '₹3,999', old: '₹12,999', sub: '500 clients / month', perks: ['Everything in Growth', 'Lead capture forms', 'Custom branding', 'Priority support'], featured: false },
  ]
  return (
    <div className="grid grid-3 mt-xl">
      {tiers.map((t) => (
        <Card key={t.name} dark={t.featured} pad={32}>
          <div className="row-between"><span className="t-title-md">{t.name}</span>{t.featured && <Badge tone="preview">Popular</Badge>}</div>
          <div className="mt-sm">{t.old && <span className="c-muted" style={{ textDecoration: 'line-through', marginRight: 8 }}>{t.old}</span>}<span className="t-display-md">{t.price}</span></div>
          <div className="t-caption c-muted mt-xs">{t.sub}</div>
          <hr className="divider" />
          <ul className="col gap-xs">{t.perks.map((p) => <li className="t-body-sm" key={p} style={{ color: t.featured ? 'var(--color-on-dark-soft)' : 'var(--color-body)' }}>✓ {p}</li>)}</ul>
          <Button as="a" href="/app" className="w-full mt-lg" variant={t.featured ? 'primary' : 'secondary'}>Get started</Button>
        </Card>
      ))}
    </div>
  )
}
