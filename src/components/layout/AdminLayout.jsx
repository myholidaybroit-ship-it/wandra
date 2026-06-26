import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import './layout.css'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: '▤', end: true },
  { to: '/app/clients', label: 'Clients', icon: '◉' },
  { to: '/app/destinations', label: 'Destinations', icon: '⌖' },
  { to: '/app/hotels', label: 'Hotels', icon: '⌂' },
  { to: '/app/cabs', label: 'Cabs', icon: '⛟' },
  { to: '/app/packages', label: 'Packages', icon: '✦' },
  { to: '/app/bookings', label: 'Bookings', icon: '✓' },
  { to: '/app/invoices', label: 'Invoices', icon: '₹' },
  { to: '/app/quotations', label: 'Quotations', icon: '❝' },
  { to: '/app/reports', label: 'Reports', icon: '◔' },
  { to: '/app/gallery', label: 'Gallery', icon: '❖' },
]
const NAV_BOTTOM = [
  { to: '/app/settings', label: 'Settings', icon: '⚙' },
  { to: '/app/users', label: 'User Management', icon: '☷' },
  { to: '/app/billing', label: 'Billing & Subscription', icon: '◇' },
  { to: '/app/support', label: 'Help & Support', icon: '?' },
]

function Logo() {
  return (
    <Link to="/app" className="brand">
      <span className="brand-mark">W</span>
      <span className="brand-name">Wandra</span>
    </Link>
  )
}

export default function AdminLayout() {
  const { agency } = useApp()
  const [open, setOpen] = useState(false)
  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top"><Logo /></div>
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="side-link" onClick={() => setOpen(false)}>
              <span className="side-ic">{n.icon}</span>{n.label}
            </NavLink>
          ))}
          <div className="side-sep" />
          {NAV_BOTTOM.map((n) => (
            <NavLink key={n.to} to={n.to} className="side-link" onClick={() => setOpen(false)}>
              <span className="side-ic">{n.icon}</span>{n.label}
            </NavLink>
          ))}
          <Link to="/" className="side-link side-logout"><span className="side-ic">⏻</span>Logout</Link>
        </nav>
      </aside>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="main-col">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen((o) => !o)}>☰</button>
          <div className="topbar-promo t-caption">
            <span className="promo-dot" /> Launch offer — all plans <strong>70% off</strong> during early access.
          </div>
          <div className="topbar-right">
            <div className="acct">
              <span className="acct-avatar">{agency.name[0]}</span>
              <div className="acct-meta">
                <span className="acct-name">{agency.name}</span>
                <span className="acct-role">ADMIN</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="content-inner">
            <Outlet />
          </div>
        </main>

        <footer className="footerbar">
          <span>hello@wandra.travel</span>
          <span className="foot-center">All-in-One Travel Software</span>
          <span>+91 78898 04942</span>
        </footer>
      </div>
    </div>
  )
}
