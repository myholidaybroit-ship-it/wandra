import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/icons'
import './landing.css'

/* No plans / pricing upfront — every agency starts on a free trial after a demo. */

export default function Landing() {
  const calendlyRef = useRef(null)

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
    <div className="landing minimal-landing">
      <section className="minimal-hero">
        <div className="minimal-hero-copy">
          <span className="minimal-eyebrow"><Icon name="dashboard" size={13} /> Travel agency CRM</span>
          <h1>Every trip, in one clear workspace.</h1>
          <p>Wandra brings enquiries, itineraries, bookings, invoices and payments together for modern travel teams.</p>
          <div className="minimal-actions"><a className="minimal-button dark" href="#demo"><Icon name="calendar" size={14} /> Book a demo</a><Link className="minimal-button light" to="/login">Log in</Link></div>
        </div>
      </section>

      <section id="product" className="minimal-section minimal-product">
        <div className="minimal-section-head"><div><span className="minimal-label">The workspace</span><h2>The CRM your team already understands.</h2></div><span className="minimal-section-note">Dashboard view</span></div>
        <CrmDashboardMock />
        <div className="minimal-connected"><span>Everything connected</span><div><span><Icon name="packages" size={14} /> Build trips</span><span><Icon name="hotels" size={14} /> Manage hotels</span><span><Icon name="cabs" size={14} /> Plan transport</span><span><Icon name="invoices" size={14} /> Collect payments</span></div></div>
      </section>

      <section id="features" className="minimal-section minimal-workflow">
        <div className="minimal-workflow-copy"><span className="minimal-label">One workflow</span><h2>From enquiry to paid invoice.</h2><p>Keep the client, plan, suppliers, vouchers and payment history attached to one trip.</p><div className="minimal-checks"><span><Icon name="check" size={14} /> Day-wise itineraries</span><span><Icon name="check" size={14} /> Separate hotel options and room prices</span><span><Icon name="check" size={14} /> Branded PDFs and WhatsApp sharing</span></div></div>
        <div className="minimal-workflow-visual"><ItineraryMock /><InvoiceMock /></div>
      </section>

      <section id="pricing" className="minimal-section minimal-trial">
        <div className="minimal-trial-card">
          <span className="minimal-label light">Getting started</span>
          <h2>Start with a free trial.</h2>
          <p>Every agency begins on a free trial — no card, no commitment. Book a demo, we'll show you Wandra around your workflow and set your workspace up for you.</p>
          <ul>
            <li><Icon name="check" size={13} /> Free trial for every new agency</li>
            <li><Icon name="check" size={13} /> Guided setup by the Wandra team</li>
            <li><Icon name="check" size={13} /> Your data, branding & inventory loaded in</li>
          </ul>
          <a href="#demo" className="minimal-price-button inverted"><Icon name="calendar" size={14} /> Book a demo</a>
        </div>
      </section>

      <section id="demo" className="minimal-section minimal-demo">
        <div className="minimal-demo-copy"><span className="minimal-label">See it in your workflow</span><h2>A calmer way to run the agency.</h2><p>Pick a time and we will show Wandra around the way your team actually works.</p></div>
        <div ref={calendlyRef} className="calendly-inline-widget" data-url="https://calendly.com/getwandra/30min" />
      </section>
    </div>
  )
}

function CrmDashboardMock() {
  const nav = [['dashboard', 'Dashboard'], ['clients', 'Trips & Clients'], ['packages', 'Packages'], ['bookings', 'Bookings'], ['invoices', 'Invoices'], ['file', 'Vouchers']]
  const trips = [['Kashmir family trip', 'Rahul Sharma', 'Confirmed'], ['Dubai honeymoon', 'Aisha Travels', 'Quoted'], ['Ladakh group tour', 'Zoya Mir', 'Paid']]
  return (
    <div className="crm-screen">
      <aside className="crm-screen-sidebar">
        <img src="/brand/wandra-logo.png" alt="Wandra" />
        {nav.map(([icon, label], index) => <span className={index === 0 ? 'active' : ''} key={label}><Icon name={icon} size={14} />{label}</span>)}
        <div className="crm-screen-sidebar-bottom"><span><Icon name="settings" size={14} />Settings</span><span><Icon name="help" size={14} />Help &amp; Support</span></div>
      </aside>
      <div className="crm-screen-main">
        <div className="crm-screen-top"><div className="crm-screen-search"><Icon name="search" size={14} />Search clients, packages, invoices...<kbd>⌘K</kbd></div><span>Growth <b>KM</b></span></div>
        <div className="crm-screen-body">
          <div className="crm-screen-heading"><div><small>Dashboard</small><h3>Good morning, Khushnood</h3></div><span>10 Jul 2026</span></div>
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
  return <div className="mini-screen itinerary-mini"><div className="mini-screen-head"><span><Icon name="packages" size={13} /> PKG-2026-0042</span><em>Draft</em></div><div className="mini-itinerary-body"><div className="mini-days"><b>Day 1</b><span>Day 2</span><span>Day 3</span></div><div className="mini-itinerary-content"><small>DAY 1 · ARRIVAL</small><h3>Welcome to Srinagar</h3>{[['Hotel options', 'Room type and selling price', 'hotels'], ['Airport transfer', 'Innova · driver details', 'cabs'], ['Sightseeing', 'Dal Lake · Mughal Gardens', 'gallery']].map(([title, text, icon]) => <div className="mini-row" key={title}><Icon name={icon} size={13} /><div><b>{title}</b><span>{text}</span></div><Icon name="chevron" size={13} /></div>)}</div></div></div>
}

function InvoiceMock() {
  return <div className="mini-screen invoice-mini"><div className="mini-invoice-brand"><span><img src="/brand/wandra-mark.png" alt="" /> WANDRA</span><em>INVOICE<br /><b>INV-2026-0092</b></em></div><div className="mini-invoice-client"><small>Bill to</small><b>Rahul Sharma</b><span>rahul@example.com · +91 98765 43210</span></div><div className="mini-invoice-lines"><div><span>Kashmir 6N / 7D package</span><b>₹84,500</b></div><div><span>Airport transfer · Innova</span><b>₹4,500</b></div><div><span>GST 5%</span><b>₹4,450</b></div></div><div className="mini-total"><span>Total</span><b>₹93,450</b></div><small className="mini-invoice-footer"><Icon name="check" size={12} /> Payment terms and footer included</small></div>
}
