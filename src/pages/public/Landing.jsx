import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/icons'
import { Sparkline, AreaChart, DonutChart } from '../../components/ui/UI'
import './landing.css'

/* ============================================================
   Wandra marketing page — monochrome, editorial, premium.
   One ink, one paper. No gradients, no accent colours — the
   only colour on the page is the destination photography.
   No plans / pricing shown (free trial + book-a-demo only),
   no personal names. Section ids: #product #features
   #included #faq #pricing #demo.
   ============================================================ */

/* scroll effects: reveal-on-enter + a soft product-shot settle — reduced-motion aware */
function useScrollFx() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' })
    document.querySelectorAll('[data-reveal]').forEach((el) => (reduced ? el.classList.add('is-in') : io.observe(el)))
    if (reduced) return () => io.disconnect()

    const shot = document.querySelector('[data-product-shot]')
    let raf = 0
    const tick = () => {
      if (shot) {
        const vh = window.innerHeight
        const r = shot.getBoundingClientRect()
        const t = Math.min(1, Math.max(0, 1 - (r.top - vh * 0.12) / (vh * 0.55)))
        shot.style.transform = `perspective(1400px) rotateX(${((1 - t) * 10).toFixed(2)}deg) scale(${(0.96 + t * 0.04).toFixed(3)})`
        shot.style.opacity = String(0.4 + t * 0.6)
      }
      raf = 0
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
}

/* the complete capability index — grouped the way an agency thinks */
const INDEX = [
  ['Sales & clients', [
    'Lead capture from site, ads & referrals',
    'Automatic lead assignment rules',
    'Client hub with documents & history',
    'Follow-up queue with reminders',
    'Pipeline from enquiry to on-trip',
  ]],
  ['Trip building', [
    'Multi-option quote builder',
    'Multi-city, day-wise itineraries',
    'Saved day plans, attached in one click',
    'Margins per line, totals computed',
    'Adult, child & infant pricing',
  ]],
  ['Inventory & rates', [
    'Destinations, cities, hotels, cabs',
    'Transport routes & activities',
    'Season-wise date-to-date rates',
    'Supplier / B2B net rates per quote',
    'Manual entries with photos',
  ]],
  ['Documents', [
    'Six designer PDF & itinerary themes',
    'Your logo & brand on every page',
    'WhatsApp-ready quote messages',
    'Formatted email itineraries',
    'One Travel Pass per trip',
  ]],
  ['Money', [
    'GST & non-GST invoices',
    'Payment schedules on bookings',
    'Partial payments, balance to the rupee',
    'Cost, selling & profit per trip',
    'Instalment follow-ups, automatic',
  ]],
  ['Team & control', [
    'A login for every teammate',
    'Role-based access, module by module',
    'Pricing hidden from roles you choose',
    'Isolated workspace per agency',
    'Reports on leads, revenue & profit',
  ]],
]

export default function Landing() {
  const calendlyRef = useRef(null)
  const [demoOpen, setDemoOpen] = useState(false)
  useScrollFx()

  // load the Calendly script once, up front
  useEffect(() => {
    const source = 'https://assets.calendly.com/assets/external/widget.js'
    if (document.querySelector(`script[src="${source}"]`)) return
    const script = document.createElement('script')
    script.src = source
    script.async = true
    document.body.appendChild(script)
  }, [])

  // init the widget into the modal each time it opens; lock scroll + Esc to close
  useEffect(() => {
    if (!demoOpen) return
    let tries = 0
    const timer = setInterval(() => {
      if (window.Calendly && calendlyRef.current) {
        calendlyRef.current.innerHTML = ''
        window.Calendly.initInlineWidget({ url: 'https://calendly.com/getwandra/30min', parentElement: calendlyRef.current })
        clearInterval(timer)
      } else if (++tries > 50) clearInterval(timer)
    }, 100)
    const onKey = (e) => e.key === 'Escape' && setDemoOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { clearInterval(timer); document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [demoOpen])

  return (
    <div className="wl">
      {/* ================= NAV ================= */}
      <header className="wl-nav">
        <div className="wl-nav-inner">
          <a className="wl-nav-brand" href="#top" aria-label="Wandra">
            <img src="/brand/wandra-logo.png" alt="Wandra" />
          </a>
          <nav className="wl-nav-links">
            <a href="#product">Product</a>
            <a href="#features">How it works</a>
            <a href="#included">What's included</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="wl-nav-cta">
            <Link to="/login">Log in</Link>
            <a className="wl-btn wl-btn-dark" href="#demo">Book a demo</a>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="wl-hero" id="top">
        <div className="wl-hero-inner">
          <span className="wl-eyebrow" data-reveal>The travel agency operating system</span>
          <h1 className="wl-h1" data-reveal>Every trip,<br />in one clear workspace.</h1>
          <p className="wl-hero-sub" data-reveal>
            Enquiries, itineraries, bookings, invoices and payments — together at last.
            Wandra replaces the spreadsheets and scattered chats your agency runs on today.
          </p>
          <div className="wl-hero-cta" data-reveal>
            <a className="wl-btn wl-btn-dark wl-btn-lg" href="#demo">Book a demo</a>
            <Link className="wl-btn wl-btn-ghost wl-btn-lg" to="/login">Log in</Link>
          </div>
          <div className="wl-hero-note" data-reveal>Free trial for every new agency&ensp;·&ensp;guided setup&ensp;·&ensp;no card needed</div>
        </div>
      </section>

      {/* ================= PRODUCT SHOT ================= */}
      <section id="product" className="wl-section wl-product">
        <div className="wl-shot-wrap" data-product-shot>
          <CrmDashboardMock />
        </div>
        <div className="wl-connected" data-reveal>
          <span className="wl-connected-k">Everything connected</span>
          <div>
            <span>Capture leads</span>
            <span>Build trips</span>
            <span>Manage hotels</span>
            <span>Plan transport</span>
            <span>Collect payments</span>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="wl-section wl-stats" data-reveal>
        {[['6', 'designer PDF & itinerary themes'], ['1', 'unified Travel Pass per trip'], ['147', 'features under the hood'], ['24×7', 'human support on WhatsApp']].map(([n, k]) => (
          <div className="wl-stat" key={k}><strong>{n}</strong><span>{k}</span></div>
        ))}
      </section>

      {/* ================= BENTO ================= */}
      <section className="wl-section">
        <div className="wl-head" data-reveal>
          <span className="wl-label">01 — The whole agency</span>
          <h2 className="wl-h2">Run everything from one place.</h2>
        </div>
        <div className="wl-bento">
          <div className="wl-card wide" data-reveal>
            <div>
              <div className="wl-card-t">Leads &amp; clients</div>
              <p>Enquiries from your website, ads and WhatsApp land in one pipeline — with follow-ups, documents and history per traveller.</p>
            </div>
            <div className="wl-pipe">
              <span className="on">New query</span>
              <span>Quoted</span>
              <span>Booked</span>
              <span>On trip</span>
            </div>
          </div>

          <div className="wl-card" data-reveal>
            <div className="wl-card-t">Quote builder</div>
            <p>Hotels, cabs, activities and flights — margins set per line, totals computed for you.</p>
            <div className="wl-quote-mini">
              <div className="wl-qrow"><span>Cost price</span><b>₹26,900</b></div>
              <div className="wl-qrow"><span>Markup 20%</span><b>+₹5,380</b></div>
              <div className="wl-qrow"><span>GST 5%</span><b>+₹1,614</b></div>
              <div className="wl-qrow sell"><span>Selling</span><b>₹33,894</b></div>
              <div className="wl-qprofit">Profit <strong>₹5,380</strong></div>
            </div>
          </div>

          <div className="wl-card" data-reveal>
            <div className="wl-card-t">Designer PDFs</div>
            <p>Six quote layouts with your branding — customise, download under 1&nbsp;MB, send.</p>
            <div className="wl-covers">
              <span className="wl-cover c1" />
              <span className="wl-cover c3" />
              <span className="wl-cover c2" />
            </div>
          </div>

          <div className="wl-card" data-reveal>
            <div className="wl-card-t">Travel Pass</div>
            <p>Hotels, transfers and activities on a single pass your traveller carries all trip.</p>
            <div className="wl-pass">
              <div className="wl-pass-b">
                <em>TRAVEL PASS</em>
                <strong>Srinagar — 5N / 6D</strong>
                <span>Hotel · Transfers · Activities</span>
              </div>
              <div className="wl-pass-stub"><span className="wl-qr" /><span className="wl-pass-code">VCH-0148</span></div>
            </div>
          </div>

          <div className="wl-card" data-reveal>
            <div className="wl-card-t">Invoices &amp; payments</div>
            <p>GST or non-GST invoices, partial payments, balance tracked to the rupee.</p>
            <div className="wl-pay">
              <div className="wl-pay-top"><span>Collected</span><b>₹63,600</b><em>of ₹93,450</em></div>
              <div className="wl-pay-bar"><span style={{ width: '68%' }} /></div>
              <div className="wl-pay-foot"><span>68% paid</span><span>Balance ₹29,850</span></div>
            </div>
          </div>

          <div className="wl-card wide" data-reveal>
            <div>
              <div className="wl-card-t">Reports &amp; profit</div>
              <p>Every booking carries its cost and selling price — so profit per trip, client and month is a glance, not a spreadsheet weekend.</p>
              <span className="wl-trend">↑ 18% profit vs last month</span>
            </div>
            <div className="wl-bars">{[40, 58, 47, 70, 63, 86, 100].map((h, i) => <i key={i} style={{ height: `${h}%` }} className={i >= 5 ? 'hot' : ''} />)}</div>
          </div>
        </div>
      </section>

      {/* ================= DESTINATIONS STRIP ================= */}
      <section className="wl-section wl-dests-sec">
        <div className="wl-head" data-reveal>
          <span className="wl-label">02 — Any destination</span>
          <h2 className="wl-h2">Built for every kind of trip.</h2>
        </div>
        <div className="wl-dests" data-reveal>
          {[
            ['Kashmir', 'photo-1506905925346-21bda4d32df4'],
            ['Dubai', 'photo-1512453979798-5ea266f8880c'],
            ['Bali', 'photo-1537996194471-e657df975ab4'],
            ['Thailand', 'photo-1552465011-b4e21bf6e79a'],
            ['Maldives', 'photo-1514282401047-d79a71a590e8'],
            ['Agra', 'photo-1524492412937-b28074a5d7da'],
          ].map(([name, id]) => (
            <figure className="wl-dest" key={name}>
              <img src={`https://images.unsplash.com/${id}?w=520&q=62&auto=format&fit=crop`} alt={name} loading="lazy" />
              <span>{name}</span>
            </figure>
          ))}
        </div>
      </section>

      {/* ================= WORKFLOW ================= */}
      <section id="features" className="wl-section wl-flow">
        <div className="wl-flow-copy">
          <div className="wl-head" data-reveal>
            <span className="wl-label">03 — One workflow</span>
            <h2 className="wl-h2">From enquiry to paid invoice.</h2>
          </div>
          <ol className="wl-steps">
            {[
              ['Capture', 'Leads arrive from your site, ads and referrals — auto-assigned to your team.'],
              ['Build', 'Compose the trip once: day-wise plan, hotel options, transport, pricing.'],
              ['Send', 'As a WhatsApp message, an email, or a branded PDF — hotel choices and prices, beautifully laid out.'],
              ['Collect', 'Confirm the booking, invoice it, record payments, hand over the Travel Pass.'],
            ].map(([t, d], i) => (
              <li key={t} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="wl-step-n">{i + 1}</span>
                <div><strong>{t}</strong><p>{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="wl-flow-visual">
          <div data-reveal><ItineraryMock /></div>
          <div data-reveal><InvoiceMock /></div>
        </div>
      </section>

      {/* ================= SEND FORMATS / DARK ================= */}
      <section className="wl-section wl-dark">
        <div className="wl-dark-grid">
          <div className="wl-dark-copy" data-reveal>
            <span className="wl-label light">04 — Three ways to send</span>
            <h2 className="wl-h2">WhatsApp,<br />email, or PDF.</h2>
            <p>
              Send every quote the way your client prefers — a ready-made WhatsApp message,
              a formatted email, or a branded PDF. Same layout, your logo on all three.
            </p>
            <div className="wl-checks">
              <span><Icon name="check" size={14} /> Formatted WhatsApp message, ready to send</span>
              <span><Icon name="check" size={14} /> Polished email with the full plan</span>
              <span><Icon name="check" size={14} /> Branded PDF, always under 1 MB</span>
            </div>
          </div>
          <div className="wl-phone-wrap">
            <div className="wl-phone" data-reveal>
              <div className="wl-phone-notch" />
              <div className="wl-phone-chat">
                <div className="wl-chat-out">Here's your Kashmir itinerary</div>
                <div className="wl-chat-media" style={{ '--phone-img': 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=560&q=62&auto=format&fit=crop")' }}>
                  <span>Kashmir · 6 days</span>
                </div>
                <div className="wl-chat-file"><Icon name="file" size={15} /><div><strong>Kashmir-6D.pdf</strong><span>PDF · 0.8 MB</span></div></div>
                <div className="wl-chat-out small">Day-wise plan, hotels &amp; price inside</div>
              </div>
            </div>
            <div className="wl-bubble" data-reveal>Looks perfect — let's book it.</div>
          </div>
        </div>
      </section>

      {/* ================= FULL FEATURE INDEX ================= */}
      <section id="included" className="wl-section wl-index">
        <div className="wl-head" data-reveal>
          <span className="wl-label">05 — What's included</span>
          <h2 className="wl-h2">Everything an agency needs.<br />Nothing it doesn't.</h2>
          <p className="wl-head-sub">Every capability below ships with Wandra — no add-ons to hunt for, no modules sold separately.</p>
        </div>
        <div className="wl-index-grid">
          {INDEX.map(([group, items], i) => (
            <div className="wl-index-col" key={group} data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="wl-index-h"><em>{String(i + 1).padStart(2, '0')}</em>{group}</div>
              <ul>
                {items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TRUST / CONTROL ================= */}
      <section className="wl-section wl-trust">
        <div className="wl-trust-grid">
          {[
            ['Your brand, not ours', 'Your logo, your contact details and your bank details on every itinerary, PDF, voucher and invoice. Clients see your agency — Wandra stays invisible.'],
            ['Control who sees what', 'Every teammate gets their own login with role-based access. Sales sees sales, accounts sees accounts — and pricing stays hidden from the roles you choose.'],
            ['A workspace of your own', 'Each agency runs in its own isolated workspace. Only your team can log in, and your client and pricing data is never shared with anyone.'],
          ].map(([t, d], i) => (
            <div className="wl-trust-item" key={t} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
              <strong>{t}</strong>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= STATEMENT ================= */}
      <section className="wl-section wl-quote" data-reveal>
        <p>
          Built for agencies still running on <em>spreadsheets and scattered chats</em> —
          and ready to be done with that.
        </p>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="wl-section wl-faq">
        <div className="wl-head" data-reveal>
          <span className="wl-label">06 — Good to know</span>
          <h2 className="wl-h2">Questions, answered.</h2>
        </div>
        <div className="wl-faq-list" data-reveal>
          {[
            ['How do we get started?', 'Book a demo below. We walk you through Wandra on your own workflow, then set up your workspace on a free trial — no card needed.'],
            ['Will clients see Wandra or our brand?', 'Your brand, front and centre. Your logo, your contact details and your bank details appear on every itinerary, PDF, voucher and invoice.'],
            ['What about our existing hotels, cabs and rates?', 'During onboarding we load your destinations, hotels, cab types and rates with you — so quotes are ready from day one.'],
            ['Do rates change by season?', 'Yes. Every hotel, activity and transport route can carry date-to-date season rates — a December trip prices at December rates automatically.'],
            ['How do we track client payments?', 'Confirmed bookings carry a payment schedule — advance and balance instalments with due dates, settled automatically as payments are recorded, with follow-ups on what is due next.'],
            ['Can our whole team use it?', 'Yes. Every teammate gets their own login with role-based access — sales sees sales, accounts sees accounts. We provision users and roles for you on request.'],
            ['Is our data safe?', 'Each agency runs in its own isolated workspace. Only your team can log in, and your client and pricing data is never shared.'],
          ].map(([q, a]) => (
            <details className="wl-faq-item" key={q}>
              <summary>{q}<Icon name="chevron" size={16} /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ================= FREE TRIAL ================= */}
      <section id="pricing" className="wl-section">
        <div className="wl-trial" data-reveal>
          <span className="wl-label light">Getting started</span>
          <h2 className="wl-h2">Start with a free trial.</h2>
          <p>
            Every agency begins on a free trial — no card, no commitment. Book a demo,
            we'll show you Wandra around your workflow and set your workspace up for you.
          </p>
          <ul>
            <li><Icon name="check" size={13} /> Free trial for every new agency</li>
            <li><Icon name="check" size={13} /> Guided setup by the Wandra team</li>
            <li><Icon name="check" size={13} /> Your data, branding &amp; inventory loaded in</li>
          </ul>
          <a href="#demo" className="wl-btn wl-btn-invert wl-btn-lg">Book a demo</a>
        </div>
      </section>

      {/* ================= DEMO ================= */}
      <section id="demo" className="wl-section wl-demo">
        <div className="wl-demo-inner" data-reveal>
          <span className="wl-label">See it in your workflow</span>
          <h2 className="wl-h2">A calmer way to run the agency.</h2>
          <p>Pick a time and we will show Wandra around the way your team actually works.</p>
          <button className="wl-btn wl-btn-dark wl-btn-lg" onClick={() => setDemoOpen(true)}>Book a demo</button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="wl-footer">
        <div className="wl-footer-inner">
          <div className="wl-footer-brand">
            <img src="/brand/wandra-logo.png" alt="Wandra" />
            <p>The operating system for travel agencies — enquiries, itineraries, bookings, invoices and payments in one clear workspace.</p>
          </div>
          <div className="wl-footer-cols">
            <div>
              <em>Product</em>
              <a href="#product">Product</a>
              <a href="#features">How it works</a>
              <a href="#included">What's included</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <em>Get started</em>
              <a href="#demo">Book a demo</a>
              <a href="#pricing">Free trial</a>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
        <div className="wl-footer-base">
          <span>© 2026 Wandra. All rights reserved.</span>
          <span>Made for travel agencies.</span>
        </div>
      </footer>

      {/* ================= DEMO MODAL ================= */}
      {demoOpen && (
        <div className="wl-modal" onClick={(e) => { if (e.target === e.currentTarget) setDemoOpen(false) }}>
          <div className="wl-modal-card">
            <button className="wl-modal-x" onClick={() => setDemoOpen(false)} aria-label="Close"><Icon name="x" size={18} /></button>
            <div ref={calendlyRef} className="calendly-inline-widget" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ================= product mock — mirrors the real Wandra dashboard ================= */
const RAMP = ['#111113', '#3a3a40', '#71717a', '#9b9ba3', '#c9c9cf']
const MONTHS = ['A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D', 'J', 'F', 'M']
const GROSS = [180, 220, 260, 240, 300, 280, 340, 360, 320, 400, 380, 460]
const COLLECTED = [140, 170, 210, 200, 250, 235, 290, 300, 275, 340, 330, 392]
const LEAD_SOURCES = [
  { label: 'Website', value: 34 }, { label: 'Instagram', value: 22 },
  { label: 'Referral', value: 18 }, { label: 'WhatsApp', value: 14 }, { label: 'Walk-in', value: 8 },
].map((s, i) => ({ ...s, color: RAMP[i % RAMP.length] }))

const NAV = [
  ['dashboard', 'Dashboard'], ['clients', 'Trips & Clients'], ['database', 'Master Data', true],
  ['wand', 'Landing Page'], ['reports', 'Reports'], ['star', 'Reviews'],
]
const KPIS = [
  { label: 'Total Revenue', value: '₹24,80,000', up: 12, spark: [9, 12, 11, 15, 14, 18, 20, 24] },
  { label: 'Total Bookings', value: '34', up: 8, spark: [3, 4, 4, 6, 5, 7, 7, 9] },
  { label: 'Active Packages', value: '28', up: 6, spark: [10, 12, 11, 14, 16, 15, 18, 20] },
  { label: 'Total Clients', value: '96', up: 9, spark: [40, 48, 55, 60, 68, 74, 85, 96] },
]

function CrmDashboardMock() {
  return (
    <div className="crm-screen">
      <aside className="crm-screen-sidebar">
        <img src="/brand/wandra-logo.png" alt="Wandra" />
        {NAV.map(([icon, label, group], i) => (
          <span className={i === 0 ? 'active' : ''} key={label}>
            <Icon name={icon} size={14} />{label}
            {group && <Icon name="chevron" size={12} className="crm-side-chev" />}
          </span>
        ))}
        <div className="crm-screen-sidebar-bottom"><span><Icon name="settings" size={14} />Settings</span><span><Icon name="help" size={14} />Help &amp; Support</span></div>
      </aside>
      <div className="crm-screen-main">
        <div className="crm-screen-top"><div className="crm-screen-search"><Icon name="search" size={14} />Search clients, packages, invoices...<kbd>⌘K</kbd></div><span>Growth Travels <b>GT</b></span></div>
        <div className="crm-screen-body">
          <div className="crm-kpis">
            {KPIS.map((k) => (
              <div className="crm-kpi" key={k.label}>
                <span className="crm-kpi-l">{k.label}</span>
                <b className="crm-kpi-v">{k.value}</b>
                <div className="crm-kpi-foot">
                  <span className="crm-kpi-delta">↑ {k.up}%</span>
                  <Sparkline data={k.spark} color="#111113" w={92} h={28} />
                </div>
              </div>
            ))}
          </div>
          <div className="crm-panels">
            <div className="crm-panel">
              <div className="crm-panel-head">
                <div>
                  <div className="crm-panel-kicker">Revenue trend · last 12 months</div>
                  <div className="crm-panel-num">₹31.4L</div>
                  <div className="crm-panel-sub">gross package value · ₹24.8L collected</div>
                </div>
                <div className="crm-legend"><span><i style={{ background: '#111113' }} />Gross</span><span><i style={{ background: '#71717a' }} />Collected</span></div>
              </div>
              <AreaChart labels={MONTHS} formatY={(v) => `${v}k`} formatV={(v) => `₹${v}k`}
                series={[{ name: 'Gross', data: GROSS, color: '#111113', fill: false }, { name: 'Collected', data: COLLECTED, color: '#71717a' }]} h={172} />
            </div>
            <div className="crm-panel">
              <div className="crm-panel-title"><b>Lead Sources</b></div>
              <div className="crm-donut-row">
                <DonutChart segments={LEAD_SOURCES} size={112} thickness={18} centerLabel="leads" />
                <div className="crm-donut-legend">
                  {LEAD_SOURCES.map((s) => (
                    <div key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span><em>{s.value}</em></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ItineraryMock() {
  return <div className="mini-screen itinerary-mini"><div className="mini-screen-head"><span><Icon name="packages" size={13} /> PKG-2026-0042</span><em>Draft</em></div><div className="mini-itinerary-body"><div className="mini-days"><b>Day 1</b><span>Day 2</span><span>Day 3</span></div><div className="mini-itinerary-content"><small>DAY 1 · ARRIVAL</small><h3>Welcome to Srinagar</h3>{[['Hotel options', 'Room type and selling price', 'hotels'], ['Airport transfer', 'Private cab · driver details', 'cabs'], ['Sightseeing', 'Dal Lake · Mughal Gardens', 'gallery']].map(([title, text, icon]) => <div className="mini-row" key={title}><Icon name={icon} size={13} /><div><b>{title}</b><span>{text}</span></div><Icon name="chevron" size={13} /></div>)}</div></div></div>
}

function InvoiceMock() {
  return <div className="mini-screen invoice-mini"><div className="mini-invoice-brand"><span><img src="/brand/wandra-mark.png" alt="" /> WANDRA</span><em>INVOICE<br /><b>INV-2026-0092</b></em></div><div className="mini-invoice-client"><small>Bill to</small><b>Rahul Sharma</b><span>rahul@example.com · +91 98765 43210</span></div><div className="mini-invoice-lines"><div><span>Kashmir 6N / 7D package</span><b>₹84,500</b></div><div><span>Airport transfer · private cab</span><b>₹4,500</b></div><div><span>GST 5%</span><b>₹4,450</b></div></div><div className="mini-total"><span>Total</span><b>₹93,450</b></div><small className="mini-invoice-footer"><Icon name="check" size={12} /> Payment terms and footer included</small></div>
}
