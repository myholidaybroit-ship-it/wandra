import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '../ui/UI'
import { Icon } from '../ui/icons'
import './layout.css'

export default function PublicLayout() {
  const loc = useLocation()
  const onLanding = loc.pathname === '/'
  return (
    <div className="public-shell">
      <nav className="public-nav">
        <Link to="/" className="brand">
          <img className="logo-lockup logo-nav" src="/brand/wandra-logo.png" alt="Wandra — Travel Software" />
        </Link>
        <div className="pnav-links">
          <a className="pnav-link" href="/#product">Product</a>
          <a className="pnav-link" href="/#features">Workflow</a>
          <a className="pnav-link" href="/#pricing">Free trial</a>
        </div>
        <div className="pnav-right">
          <Link to="/login"><Button size="sm" variant="secondary">Log In</Button></Link>
          <a href="/#demo"><Button size="sm"><Icon name="calendar" size={14} />Book a demo</Button></a>
        </div>
      </nav>

      <main className="public-main"><Outlet /></main>

      <footer className="public-footer">
        <div className="public-foot-inner foot-min">
          <img className="logo-lockup logo-foot" src="/brand/wandra-logo.png" alt="Wandra — Travel Software" />
          <p className="foot-tagline">The operating system &amp; CRM for travel agencies — run your entire agency from one connected dashboard.</p>
          <span className="foot-copy">© 2026 Wandra. All rights reserved.</span>
        </div>
      </footer>
      {!onLanding && <a className="wa-float" href="#" title="Chat on WhatsApp"></a>}
    </div>
  )
}
