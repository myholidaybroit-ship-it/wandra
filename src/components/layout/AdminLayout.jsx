import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { pathFeature } from '../../featureGate'
import { useApp } from '../../store/AppContext'
import { Button } from '../ui/UI'
import { Icon } from '../ui/icons'
import { AgencyLogo } from '../ui/AgencyBrand'
import RenewalBanner from './RenewalBanner'
import './layout.css'

const NAV_TOP = [
  { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true, feature: 'dashboard.view' },
  { to: '/app/clients', label: 'Trips & Clients', icon: 'clients', feature: 'crm.view' },
]
const MASTER_DATA = [
  { to: '/app/destinations', label: 'Destinations', icon: 'destinations', feature: 'master.destinations' },
  { to: '/app/hotels', label: 'Hotels', icon: 'hotels', feature: 'master.hotels' },
  { to: '/app/cabs', label: 'Cabs', icon: 'cabs', feature: 'master.cabs' },
  { to: '/app/services', label: 'Service Locations', icon: 'destinations', feature: 'master.service_locations' },
  { to: '/app/activities', label: 'Activities', icon: 'gallery', feature: 'master.activities' },
  { to: '/app/packages/templates', label: 'Day-wise Plans', icon: 'file', feature: 'builder.templates' },
  { to: '/app/packages/inclusions', label: 'Incl. & Excl.', icon: 'check', feature: 'master.inclusions' },
]
const NAV_END = [
  { to: '/app/landing', label: 'Landing Page', icon: 'wand', feature: 'landing.builder' },
  { to: '/app/reports', label: 'Reports', icon: 'reports', feature: 'reports.view' },
  { to: '/app/gallery', label: 'Reviews', icon: 'star', feature: 'reviews.view' },
]
const NAV_BOTTOM = [
  { to: '/app/settings', label: 'Settings', icon: 'settings', feature: 'branding.agency_profile' },
  { to: '/app/users', label: 'User Management', icon: 'users', feature: 'team.users' },
  { to: '/app/roles', label: 'Roles & Permissions', icon: 'check', feature: 'team.roles' },
  { to: '/app/assignment', label: 'Lead Assignment', icon: 'refresh', feature: 'team.lead_assignment' },
  { to: '/app/billing', label: 'Billing & Subscription', icon: 'billing' },
  { to: '/app/support', label: 'Help & Support', icon: 'help' },
]

function Logo({ collapsed, agency, isPro }) {
  const agencyLogo = agency?.logo && !String(agency.logo).includes('wandra-logo')
  if (isPro && agencyLogo) {
    return (
      <Link to="/app" className="brand brand-agency" title={agency.name || 'Agency'}>
        <AgencyLogo agency={agency} className={collapsed ? 'agency-side-logo collapsed' : 'agency-side-logo'} fallback="name" />
      </Link>
    )
  }
  return (
    <Link to="/app" className="brand" title="Wandra — Travel Software">
      {collapsed
        ? <img className="logo-mark-side" src="/brand/wandra-mark.png" alt="Wandra" />
        : <img className="logo-lockup logo-side" src="/brand/wandra-logo.png" alt="Wandra — Travel Software" />}
    </Link>
  )
}

/* ---------- Global search modal (⌘K) ---------- */
function SearchModal({ open, onClose }) {
  const nav = useNavigate()
  const { clients, packages, bookings, invoices, hotels, destinations, cabs } = useApp()
  const [q, setQ] = useState('')

  useEffect(() => { if (!open) setQ('') }, [open])
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const s = q.trim().toLowerCase()
  const match = (...fields) => fields.some((f) => String(f || '').toLowerCase().includes(s))
  const groups = s
    ? [
        { label: 'Clients', items: clients.filter((c) => match(c.name, c.code, c.phone, c.email)).slice(0, 5).map((c) => ({ icon: 'clients', title: c.name, sub: c.code, to: `/app/clients/${c.id}` })) },
        { label: 'Packages', items: packages.filter((p) => match(p.code, p.destination, p.clientName)).slice(0, 5).map((p) => ({ icon: 'packages', title: p.destination, sub: p.code, to: `/app/packages/${p.id}` })) },
        { label: 'Bookings', items: bookings.filter((b) => match(b.code, b.clientName)).slice(0, 5).map((b) => ({ icon: 'bookings', title: b.clientName, sub: b.code, to: `/app/bookings/${b.id}` })) },
        { label: 'Invoices', items: invoices.filter((i) => match(i.code, i.clientName)).slice(0, 5).map((i) => ({ icon: 'invoices', title: i.clientName, sub: i.code, to: `/app/invoices/${i.id}` })) },
        { label: 'Hotels', items: hotels.filter((h) => match(h.name, h.city)).slice(0, 5).map((h) => ({ icon: 'hotels', title: h.name, sub: h.city, to: `/app/hotels/${h.id}` })) },
        { label: 'Destinations', items: destinations.filter((d) => match(d.name, d.location)).slice(0, 5).map((d) => ({ icon: 'destinations', title: d.name, sub: d.location, to: `/app/destinations/${d.id}` })) },
        { label: 'Cabs', items: cabs.filter((c) => match(c.name, c.type)).slice(0, 5).map((c) => ({ icon: 'cabs', title: c.name, sub: c.type, to: `/app/cabs/${c.id}` })) },
      ].filter((g) => g.items.length)
    : []
  const first = groups[0]?.items[0]

  const go = (to) => { nav(to); onClose() }

  return (
    <div className="modal-overlay search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-input">
          <span className="search-modal-glyph"><Icon name="search" size={17} /></span>
          <input
            autoFocus
            placeholder="Search clients, packages, bookings, invoices…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && first) go(first.to) }}
          />
          <button className="kbd-hint" onClick={onClose}>ESC</button>
        </div>
        {s ? (
          <div className="search-results">
            {groups.length === 0 && <div className="search-empty t-body-sm c-muted">No results for “{q}”</div>}
            {groups.map((g) => (
              <div key={g.label}>
                <div className="search-group">{g.label}</div>
                {g.items.map((it) => (
                  <button key={it.to + it.title} className="search-row" onClick={() => go(it.to)}>
                    <span className="search-row-ic"><Icon name={it.icon} size={14} /></span>
                    <span className="search-row-title">{it.title}</span>
                    <span className="search-row-sub">{it.sub}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="search-hint t-caption c-muted">
            Search across clients, packages, bookings, invoices, hotels, destinations & cabs. Press Enter to open the top result.
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { agency, clients, currentUser, ready, authed, logout, hasFeature, sessionExpiresAt } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [acctOpen, setAcctOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('wandra-sidebar') === 'collapsed')
  const { pathname } = useLocation()
  // filter every nav group by the agency's enabled features (admin-controlled)
  const navFilter = (arr) => arr.filter((n) => !n.feature || hasFeature(n.feature))
  const navTop = navFilter(NAV_TOP)
  const masterData = navFilter(MASTER_DATA)
  const navEnd = navFilter(NAV_END)
  const navBottom = navFilter(NAV_BOTTOM)
  const masterActive = masterData.some((n) => pathname.startsWith(n.to))
  const [masterOpen, setMasterOpen] = useState(masterActive)
  const [flyout, setFlyout] = useState(null)
  useEffect(() => { if (masterActive) setMasterOpen(true) }, [masterActive])
  useEffect(() => { setFlyout(null) }, [pathname, collapsed])

  const toggleSidebar = () => {
    setCollapsed((c) => {
      localStorage.setItem('wandra-sidebar', c ? 'expanded' : 'collapsed')
      return !c
    })
  }

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') setAcctOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // auth guard — bounce to login once bootstrap resolves without a session
  useEffect(() => {
    if (ready && !authed) nav('/login', { replace: true, state: { from: pathname } })
  }, [ready, authed, nav, pathname])
  if (!ready || !authed) {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#6b7280' }}>Loading…</div>
  }
  const doLogout = () => { logout(); nav('/login', { replace: true }) }
  const planName = agency.plan?.name || agency.plan || ''
  const planLimitValue = agency.plan?.limit ?? agency.limits?.clients ?? -1
  const isPro = String(planName).toLowerCase() === 'pro'
  const planLimit = planLimitValue === -1 ? '∞' : planLimitValue
  const usedPct = planLimitValue === -1 ? 0 : Math.min(100, (clients.length / planLimitValue) * 100)
  const sessionExpiry = sessionExpiresAt?.()
  const sessionLabel = sessionExpiry
    ? sessionExpiry.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Browser session'

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-top"><Logo collapsed={collapsed} agency={agency} isPro={isPro} /></div>
        <nav className="sidebar-nav">
          {navTop.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="side-link" title={collapsed ? n.label : undefined} onClick={() => setOpen(false)}>
              <span className="side-ic"><Icon name={n.icon} /></span>
              <span className="side-txt">{n.label}</span>
            </NavLink>
          ))}

          {masterData.length > 0 && (collapsed ? (
            <button
              className={`side-link side-group ${masterActive ? 'active' : ''}`}
              title="Master Data"
              onClick={(e) => setFlyout(flyout ? null : { top: e.currentTarget.getBoundingClientRect().top })}
            >
              <span className="side-ic"><Icon name="database" /></span>
              <span className="side-txt">Master Data</span>
            </button>
          ) : (
            <>
              <button className={`side-link side-group ${masterActive ? 'active' : ''}`} onClick={() => setMasterOpen((o) => !o)}>
                <span className="side-ic"><Icon name="database" /></span>
                <span className="side-txt">Master Data</span>
                <span className={`side-group-chev ${masterOpen ? 'up' : ''}`}><Icon name="chevron" size={13} strokeWidth={2} /></span>
              </button>
              {masterOpen && (
                <div className="side-children">
                  {masterData.map((n) => (
                    <NavLink key={n.to} to={n.to} className="side-link side-child" onClick={() => setOpen(false)}>
                      <span className="side-ic"><Icon name={n.icon} size={16} /></span>
                      <span className="side-txt">{n.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ))}

          {navEnd.map((n) => (
            <NavLink key={n.to} to={n.to} className="side-link" title={collapsed ? n.label : undefined} onClick={() => setOpen(false)}>
              <span className="side-ic"><Icon name={n.icon} /></span>
              <span className="side-txt">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-plan-card">
            <div className="row-between">
              <span className="side-plan-name">{planName}</span>
              <span className="side-plan-usage">{clients.length}/{planLimit}</span>
            </div>
            <div className="side-plan-bar"><span style={{ width: `${usedPct}%` }} /></div>
            <Button as="a" href="/app/billing" size="sm" className="w-full mt-sm">{isPro ? 'Manage plan' : 'Upgrade plan'}</Button>
          </div>
        </div>
      </aside>
      {flyout && (
        <>
          <div className="flyout-scrim" onClick={() => setFlyout(null)} />
          <div className="side-flyout" style={{ top: flyout.top }}>
            <div className="side-flyout-head">Master Data</div>
            {masterData.map((n) => (
              <NavLink key={n.to} to={n.to} className="side-link" onClick={() => setFlyout(null)}>
                <span className="side-ic"><Icon name={n.icon} size={16} /></span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </div>
        </>
      )}
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="main-col">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen((o) => !o)}>☰</button>
          <button className="collapse-btn" onClick={toggleSidebar} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Icon name="panel" size={17} />
          </button>
          <button className="search-pill topbar-search search-btn" onClick={() => setSearchOpen(true)}>
            <Icon name="search" size={15} />
            <span className="search-btn-label">Search clients, packages, invoices…</span>
            <span className="kbd-hint">⌘K</span>
          </button>
          <button className="btn-icon search-btn-sm" onClick={() => setSearchOpen(true)} title="Search"><Icon name="search" size={16} /></button>
          <div className="topbar-right">
            <div className="plan-pill">
              <div className="plan-pill-meta">
                <span className="plan-pill-name">{agency.plan.name}</span>
                <span className="plan-pill-usage">{clients.length}/{planLimit} clients used</span>
              </div>
              <Button as="a" href="/app/billing" size="sm" className="plan-pill-cta">{isPro ? 'Manage' : 'Upgrade'}</Button>
            </div>
            <div className="acct-wrap">
              <button className="acct" onClick={() => setAcctOpen((o) => !o)}>
                <span className="acct-avatar"><img src="/brand/wandra-mark.png" alt="" /></span>
                <div className="acct-meta">
                  <span className="acct-name">{currentUser?.name || agency.name}</span>
                  <span className="acct-role">{currentUser?.role || 'Admin'}</span>
                </div>
                <span className={`acct-chev ${acctOpen ? 'up' : ''}`}><Icon name="chevron" size={14} strokeWidth={2} /></span>
              </button>
              {acctOpen && (
                <>
                  <div className="acct-scrim" onClick={() => setAcctOpen(false)} />
                  <div className="acct-menu">
                    <div className="acct-menu-head">
                      <span className="acct-avatar"><img src="/brand/wandra-mark.png" alt="" /></span>
                      <div>
                        <div className="acct-name">{currentUser?.name || agency.name}</div>
                        <div className="acct-menu-email">{currentUser?.email || agency.email} · {currentUser?.role || 'Admin'}</div>
                        <div className="acct-session">Session active until {sessionLabel}</div>
                      </div>
                    </div>
                    <div className="acct-menu-sep" />
                    {navBottom.map((n) => (
                      <NavLink key={n.to} to={n.to} className="acct-menu-item" onClick={() => setAcctOpen(false)}>
                        <span className="side-ic"><Icon name={n.icon} size={16} /></span>{n.label}
                      </NavLink>
                    ))}
                    <div className="acct-menu-sep" />
                    <button type="button" className="acct-menu-item acct-menu-logout" onClick={() => { setAcctOpen(false); doLogout() }}>
                      <span className="side-ic"><Icon name="logout" size={16} /></span>Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <div className="content-inner">
            {(() => {
              const gate = pathFeature(pathname)
              if (gate && !hasFeature(gate)) {
                return (
                  <div style={{ maxWidth: 520, margin: '10vh auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}></div>
                    <h2 className="t-display-sm">Feature not available</h2>
                    <p className="t-body-md c-body" style={{ marginTop: 8 }}>
                      This module isn’t enabled on your current plan. Contact Wandra to enable it, or view your plan.
                    </p>
                    <div style={{ marginTop: 18 }}>
                      <Button as="a" href="/app/billing">View plan &amp; billing</Button>
                    </div>
                  </div>
                )
              }
              return <Outlet />
            })()}
          </div>
        </main>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <RenewalBanner />
    </div>
  )
}
