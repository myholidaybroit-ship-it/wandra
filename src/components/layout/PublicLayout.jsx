import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '../ui/UI'
import './layout.css'

export default function PublicLayout() {
  const loc = useLocation()
  const onLanding = loc.pathname === '/'
  return (
    <div className="public-shell">
      <nav className="public-nav">
        <Link to="/" className="brand">
          <span className="pnav-mark">W</span>
          <span className="brand-name" style={{ color: 'var(--color-ink)' }}>Wandra</span>
        </Link>
        <div className="pnav-links">
          <a className="pnav-link" href="#features">Features</a>
          <a className="pnav-link" href="#pricing">Pricing</a>
          <a className="pnav-link" href="#reviews">Reviews</a>
          <a className="pnav-link" href="#faq">FAQ</a>
        </div>
        <div className="pnav-right">
          <Link className="pnav-link" to="/login">Log In</Link>
          <Button as="a" href="/app" size="sm">Start Free Trial</Button>
        </div>
      </nav>

      <main className="public-main"><Outlet /></main>

      <footer className="public-footer">
        <div className="public-foot-grid">
          <div>
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="pnav-mark">W</span>
              <span className="brand-name" style={{ color: 'var(--color-ink)' }}>Wandra</span>
            </div>
            <p className="t-body-sm c-body" style={{ maxWidth: 280 }}>
              The operating system & CRM for travel agencies. Run your entire agency from one connected dashboard.
            </p>
          </div>
          <div>
            <div className="t-caption-upper c-muted mb-sm">Product</div>
            <a className="foot-link" href="#features">Features</a>
            <a className="foot-link" href="#pricing">Pricing</a>
            <Link className="foot-link" to="/i/PKG-202602-0003">Sample Itinerary</Link>
          </div>
          <div>
            <div className="t-caption-upper c-muted mb-sm">Company</div>
            <a className="foot-link" href="#">About</a>
            <a className="foot-link" href="#">Contact</a>
            <Link className="foot-link" to="/inquiry">Plan a trip</Link>
          </div>
          <div>
            <div className="t-caption-upper c-muted mb-sm">Reach us</div>
            <span className="foot-link">hello@wandra.travel</span>
            <span className="foot-link">+91 78898 04942</span>
          </div>
        </div>
      </footer>
      {!onLanding && <a className="wa-float" href="#" title="Chat on WhatsApp">✆</a>}
    </div>
  )
}
