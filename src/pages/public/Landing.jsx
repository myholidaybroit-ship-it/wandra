import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/icons'
import './landing.css'

/* ============================================================
   Wandra marketing one-pager — Apple-style spacious layout with
   scroll reveals + parallax drift. No plans / pricing shown
   anywhere (free trial + book-a-demo only), no personal names.
   Section ids (#product #features #pricing #demo) feed the nav.
   ============================================================ */

/* scroll effects: reveal-on-enter + parallax drift — rAF-batched, reduced-motion aware */
function useScrollFx() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' })
    document.querySelectorAll('[data-reveal]').forEach((el) => (reduced ? el.classList.add('is-in') : io.observe(el)))
    if (reduced) return () => io.disconnect()

    const drifters = [...document.querySelectorAll('[data-parallax]')]
    const shot = document.querySelector('[data-product-shot]')
    let raf = 0
    const tick = () => {
      const vh = window.innerHeight
      drifters.forEach((el) => {
        const speed = Number(el.dataset.parallax) || 0.2
        const r = el.getBoundingClientRect()
        const p = (r.top + r.height / 2 - vh / 2) / vh          // -1 … 1 across the viewport
        el.style.setProperty('--drift', `${(-p * speed * 110).toFixed(1)}px`)
      })
      if (shot) {
        const r = shot.getBoundingClientRect()
        const t = Math.min(1, Math.max(0, 1 - (r.top - vh * 0.12) / (vh * 0.55)))
        shot.style.transform = `perspective(1400px) rotateX(${((1 - t) * 14).toFixed(2)}deg) scale(${(0.94 + t * 0.06).toFixed(3)})`
        shot.style.opacity = String(0.35 + t * 0.65)
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

export default function Landing() {
  const calendlyRef = useRef(null)
  useScrollFx()

  useEffect(() => {
    const source = 'https://assets.calendly.com/assets/external/widget.js'
    const init = () => {
      if (window.Calendly && calendlyRef.current) {
        window.Calendly.initInlineWidget({ url: 'https://calendly.com/getwandra/30min', parentElement: calendlyRef.current })
      }
    }
    const existing = document.querySelector(`script[src="${source}"]`)
    if (existing) { init(); return undefined }
    const script = document.createElement('script')
    script.src = source
    script.async = true
    script.addEventListener('load', init)
    document.body.appendChild(script)
    return () => script.removeEventListener('load', init)
  }, [])

  return (
    <div className="wl">
      {/* ================= HERO ================= */}
      <section className="wl-hero">
        <span className="wl-orb wl-orb-a" data-parallax="0.5" />
        <span className="wl-orb wl-orb-b" data-parallax="0.3" />
        <div className="wl-hero-inner">
          <span className="wl-eyebrow" data-reveal><Icon name="dashboard" size={13} /> The travel agency operating system</span>
          <h1 className="wl-h1" data-reveal>Every trip,<br />in one clear workspace.</h1>
          <p className="wl-hero-sub" data-reveal>
            Enquiries, itineraries, bookings, invoices and payments — together at last.
            Wandra replaces the spreadsheets and scattered chats your agency runs on today.
          </p>
          <div className="wl-hero-cta" data-reveal>
            <a className="wl-btn wl-btn-dark wl-btn-lg" href="#demo"><Icon name="calendar" size={15} /> Book a demo</a>
            <Link className="wl-btn wl-btn-light wl-btn-lg" to="/login">Log in</Link>
          </div>
          <div className="wl-hero-note" data-reveal>Free trial for every new agency · guided setup · no card needed</div>
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
            <span><Icon name="clients" size={14} /> Capture leads</span>
            <span><Icon name="packages" size={14} /> Build trips</span>
            <span><Icon name="hotels" size={14} /> Manage hotels</span>
            <span><Icon name="cabs" size={14} /> Plan transport</span>
            <span><Icon name="invoices" size={14} /> Collect payments</span>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="wl-section wl-stats" data-reveal>
        {[['6', 'designer PDF & itinerary themes'], ['1', 'unified Travel Pass per trip'], ['140+', 'features under the hood'], ['24×7', 'human support on WhatsApp']].map(([n, k]) => (
          <div className="wl-stat" key={k}><strong>{n}</strong><span>{k}</span></div>
        ))}
      </section>

      {/* ================= DESTINATIONS STRIP ================= */}
      <section className="wl-section wl-dests-sec">
        <div className="wl-head" data-reveal>
          <span className="wl-label">Any destination</span>
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

      {/* ================= BENTO GRID ================= */}
      <section className="wl-section">
        <div className="wl-head" data-reveal>
          <span className="wl-label">The whole agency</span>
          <h2 className="wl-h2">Run everything from one place.</h2>
        </div>
        <div className="wl-bento">
          <div className="wl-card wide" data-reveal>
            <div>
              <span className="wl-card-ic"><Icon name="clients" size={17} /></span>
              <div className="wl-card-t">Leads &amp; clients</div>
              <p>Enquiries from your website, ads and WhatsApp land in one pipeline — with follow-ups, documents and history per traveller.</p>
            </div>
            <div className="wl-pipeline">
              <span className="on">New query</span><i /><span>Quoted</span><i /><span>Booked</span><i /><span className="paid">On trip</span>
            </div>
          </div>
          <div className="wl-card" data-reveal>
            <span className="wl-card-ic"><Icon name="packages" size={17} /></span>
            <div className="wl-card-t">Quote builder</div>
            <p>Hotels, cabs, activities and flights — margins set per line, totals computed for you.</p>
            <div className="wl-margin">
              <div><span>Cost</span><strong>₹26,900</strong></div>
              <div><span>Markup</span><strong>+20%</strong></div>
              <div className="sell"><span>Selling</span><strong>₹33,894</strong></div>
            </div>
          </div>
          <div className="wl-card" data-reveal>
            <span className="wl-card-ic"><Icon name="file" size={17} /></span>
            <div className="wl-card-t">Designer PDFs</div>
            <p>Six quote layouts with your branding — customise, download under 1&nbsp;MB, send.</p>
            <div className="wl-fan"><i /><i /><i /></div>
          </div>
          <div className="wl-card" data-reveal>
            <span className="wl-card-ic"><Icon name="plane" size={17} /></span>
            <div className="wl-card-t">Travel Pass</div>
            <p>Hotels, transfers and activities on a single pass your traveller carries all trip.</p>
            <div className="wl-pass">
              <div className="wl-pass-b">
                <em>TRAVEL PASS</em>
                <strong>Srinagar — 5N / 6D</strong>
                <span>Hotel · Transfers · Activities</span>
              </div>
              <div className="wl-pass-stub" />
            </div>
          </div>
          <div className="wl-card" data-reveal>
            <span className="wl-card-ic"><Icon name="invoices" size={17} /></span>
            <div className="wl-card-t">Invoices &amp; payments</div>
            <p>GST or non-GST invoices, partial payments, balance tracked to the rupee.</p>
            <div className="wl-paybar"><span style={{ width: '68%' }} /><em>68% collected</em></div>
          </div>
          <div className="wl-card wide" data-reveal>
            <div>
              <span className="wl-card-ic"><Icon name="reports" size={17} /></span>
              <div className="wl-card-t">Reports &amp; profit</div>
              <p>Every booking carries its cost and selling price — so profit per trip, client and month is a glance, not a spreadsheet weekend.</p>
            </div>
            <div className="wl-bars">{[42, 66, 51, 88, 74, 96].map((h, i) => <i key={i} style={{ height: `${h}%` }} className={i === 5 ? 'hot' : ''} />)}</div>
          </div>
        </div>
      </section>

      {/* ================= WORKFLOW ================= */}
      <section id="features" className="wl-section wl-flow">
        <div className="wl-flow-copy">
          <div className="wl-head" data-reveal>
            <span className="wl-label">One workflow</span>
            <h2 className="wl-h2">From enquiry to paid invoice.</h2>
          </div>
          <ol className="wl-steps">
            {[
              ['Capture', 'Leads arrive from your site, ads and referrals — auto-assigned to your team.'],
              ['Build', 'Compose the trip once: day-wise plan, hotel options, transport, pricing.'],
              ['Share', 'One link or PDF on WhatsApp — hotel choices and prices, beautifully laid out.'],
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
          <div data-reveal data-parallax="0.14" className="wl-driftable"><ItineraryMock /></div>
          <div data-reveal data-parallax="0.3" className="wl-driftable"><InvoiceMock /></div>
        </div>
      </section>

      {/* ================= SHARE / DARK ================= */}
      <section className="wl-section wl-dark">
        <span className="wl-orb wl-orb-c" data-parallax="0.4" />
        <div className="wl-dark-grid">
          <div className="wl-dark-copy" data-reveal>
            <span className="wl-label light">Share anywhere</span>
            <h2 className="wl-h2">One link.<br />Any phone.</h2>
            <p>
              Every quote becomes a live page your client opens straight from WhatsApp — no app,
              no download. They see the plan, the hotels and the price. You see it convert.
            </p>
            <div className="wl-checks">
              <span><Icon name="check" size={14} /> Branded with your logo &amp; details</span>
              <span><Icon name="check" size={14} /> Day-wise plan with photos</span>
              <span><Icon name="check" size={14} /> PDF fallback, always under 1 MB</span>
            </div>
          </div>
          <div className="wl-phone-wrap" data-parallax="0.2">
            <div className="wl-phone" data-reveal>
              <div className="wl-phone-notch" />
              <div className="wl-phone-hero" style={{ '--phone-img': 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=560&q=62&auto=format&fit=crop")' }}>Kashmir · 6 days</div>
              <div className="wl-phone-rows">
                <div><strong>Day 1</strong><span>Arrival · Dal Lake shikara</span></div>
                <div><strong>Day 2</strong><span>Gulmarg gondola</span></div>
                <div><strong>Day 3</strong><span>Pahalgam valleys</span></div>
              </div>
              <div className="wl-phone-cta">View full itinerary</div>
            </div>
            <div className="wl-bubble" data-reveal>Here's your itinerary — take a look! ✈️</div>
          </div>
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
      <section className="wl-section wl-faq">
        <div className="wl-head" data-reveal>
          <span className="wl-label">Good to know</span>
          <h2 className="wl-h2">Questions, answered.</h2>
        </div>
        <div className="wl-faq-list" data-reveal>
          {[
            ['How do we get started?', 'Book a demo below. We walk you through Wandra on your own workflow, then set up your workspace on a free trial — no card needed.'],
            ['Will clients see Wandra or our brand?', 'Your brand, front and centre. Your logo, your contact details and your bank details appear on every itinerary, PDF, voucher and invoice.'],
            ['What about our existing hotels, cabs and rates?', 'During onboarding we load your destinations, hotels, cab types and rates with you — so quotes are ready from day one.'],
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
          <span className="wl-orb wl-orb-d" data-parallax="0.35" />
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
          <a href="#demo" className="wl-btn wl-btn-invert wl-btn-lg"><Icon name="calendar" size={14} /> Book a demo</a>
        </div>
      </section>

      {/* ================= DEMO ================= */}
      <section id="demo" className="wl-section wl-demo">
        <div className="wl-demo-copy" data-reveal>
          <span className="wl-label">See it in your workflow</span>
          <h2 className="wl-h2">A calmer way to run the agency.</h2>
          <p>Pick a time and we will show Wandra around the way your team actually works.</p>
        </div>
        <div ref={calendlyRef} className="calendly-inline-widget" data-url="https://calendly.com/getwandra/30min" />
      </section>
    </div>
  )
}

/* ================= product mock ================= */
function CrmDashboardMock() {
  const nav = [['dashboard', 'Dashboard'], ['clients', 'Trips & Clients'], ['packages', 'Packages'], ['bookings', 'Bookings'], ['invoices', 'Invoices'], ['file', 'Travel Pass']]
  const trips = [['Kashmir family trip', 'Rahul Sharma', 'Confirmed'], ['Dubai honeymoon', 'Aisha Travels', 'Quoted'], ['Ladakh group tour', 'Zoya Mir', 'Paid']]
  return (
    <div className="crm-screen">
      <aside className="crm-screen-sidebar">
        <img src="/brand/wandra-logo.png" alt="Wandra" />
        {nav.map(([icon, label], index) => <span className={index === 0 ? 'active' : ''} key={label}><Icon name={icon} size={14} />{label}</span>)}
        <div className="crm-screen-sidebar-bottom"><span><Icon name="settings" size={14} />Settings</span><span><Icon name="help" size={14} />Help &amp; Support</span></div>
      </aside>
      <div className="crm-screen-main">
        <div className="crm-screen-top"><div className="crm-screen-search"><Icon name="search" size={14} />Search clients, packages, invoices...<kbd>⌘K</kbd></div><span>Growth <b>GT</b></span></div>
        <div className="crm-screen-body">
          <div className="crm-screen-heading"><div><small>Dashboard</small><h3>Good morning, team</h3></div><span>Today</span></div>
          <div className="crm-kpis"><Kpi label="Total package value" value="₹12,80,000" note="This month" /><Kpi label="Active trips" value="28" note="+12%" /><Kpi label="Pending payments" value="₹2.4L" note="8 invoices" /></div>
          <div className="crm-panels">
            <div className="crm-panel"><div className="crm-panel-title"><b>Package value</b><span>Last 30 days</span></div><div className="crm-chart"><i /><i /><i /><i /><b /></div></div>
            <div className="crm-panel"><div className="crm-panel-title"><b>Upcoming trips</b><span>View all</span></div>{trips.map(([name, person, status], index) => <div className="crm-trip" key={name}><Icon name={index === 1 ? 'plane' : 'packages'} size={14} /><div><b>{name}</b><small>{person}</small></div><em>{status}</em></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, note }) { return <div className="crm-kpi"><span>{label}</span><b>{value}</b><small>{note}</small></div> }

function ItineraryMock() {
  return <div className="mini-screen itinerary-mini"><div className="mini-screen-head"><span><Icon name="packages" size={13} /> PKG-2026-0042</span><em>Draft</em></div><div className="mini-itinerary-body"><div className="mini-days"><b>Day 1</b><span>Day 2</span><span>Day 3</span></div><div className="mini-itinerary-content"><small>DAY 1 · ARRIVAL</small><h3>Welcome to Srinagar</h3>{[['Hotel options', 'Room type and selling price', 'hotels'], ['Airport transfer', 'Private cab · driver details', 'cabs'], ['Sightseeing', 'Dal Lake · Mughal Gardens', 'gallery']].map(([title, text, icon]) => <div className="mini-row" key={title}><Icon name={icon} size={13} /><div><b>{title}</b><span>{text}</span></div><Icon name="chevron" size={13} /></div>)}</div></div></div>
}

function InvoiceMock() {
  return <div className="mini-screen invoice-mini"><div className="mini-invoice-brand"><span><img src="/brand/wandra-mark.png" alt="" /> WANDRA</span><em>INVOICE<br /><b>INV-2026-0092</b></em></div><div className="mini-invoice-client"><small>Bill to</small><b>Rahul Sharma</b><span>rahul@example.com · +91 98765 43210</span></div><div className="mini-invoice-lines"><div><span>Kashmir 6N / 7D package</span><b>₹84,500</b></div><div><span>Airport transfer · private cab</span><b>₹4,500</b></div><div><span>GST 5%</span><b>₹4,450</b></div></div><div className="mini-total"><span>Total</span><b>₹93,450</b></div><small className="mini-invoice-footer"><Icon name="check" size={12} /> Payment terms and footer included</small></div>
}
