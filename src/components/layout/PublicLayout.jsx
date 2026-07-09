import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Button } from '../ui/UI'
import './layout.css'

export default function PublicLayout() {
  const loc = useLocation()
  const onLanding = loc.pathname === '/'
  const [promo, setPromo] = useState(() => sessionStorage.getItem('wandra-public-promo') !== 'off')
  const dismissPromo = () => { sessionStorage.setItem('wandra-public-promo', 'off'); setPromo(false) }
  return (
    <div className="public-shell">
      {promo && (
        <div className="promo-banner">
          <span className="promo-copy">
            Early access — all plans <strong>70% off</strong>. <Link to="/?trial=1" className="promo-link">Claim the launch offer</Link>
          </span>
          <button className="promo-x" onClick={dismissPromo} title="Dismiss">✕</button>
        </div>
      )}
      <nav className="public-nav">
        <Link to="/" className="brand">
          <img className="logo-lockup logo-nav" src="/brand/wandra-logo.png" alt="Wandra — Travel Software" />
        </Link>
        <div className="pnav-links">
          <a className="pnav-link" href="/#product">Product</a>
          <a className="pnav-link" href="/#features">Features</a>
          <a className="pnav-link" href="/#pricing">Pricing</a>
          <a className="pnav-link" href="/#reviews">Reviews</a>
        </div>
        <div className="pnav-right">
          <Link to="/login"><Button size="sm" variant="secondary">Log In</Button></Link>
          <Link to="/?trial=1"><Button size="sm">Start Free Trial</Button></Link>
        </div>
      </nav>

      <main className="public-main"><Outlet /></main>

      <footer className="public-footer">
        <div className="public-foot-inner">
          <div className="public-foot-top">
            <div>
              <div className="brand">
                <img className="logo-lockup logo-foot" src="/brand/wandra-logo.png" alt="Wandra — Travel Software" />
              </div>
              <p className="foot-tagline">
                The operating system & CRM for travel agencies. Run your entire agency from one connected dashboard.
              </p>
            </div>
            <div className="foot-social">
              <a className="foot-social-dot" href="#" title="X">𝕏</a>
              <a className="foot-social-dot" href="#" title="Instagram">◎</a>
              <a className="foot-social-dot" href="#" title="YouTube">▶</a>
              <a className="foot-social-dot" href="#" title="LinkedIn">in</a>
            </div>
          </div>
          <div className="public-foot-grid">
            <div>
              <div className="foot-head">Product</div>
              <a className="foot-link" href="/#product">Modules</a>
              <a className="foot-link" href="/#features">Features</a>
              <a className="foot-link" href="/#pricing">Pricing</a>
              <Link className="foot-link" to="/i/PKG-202602-0003">Sample Itinerary</Link>
            </div>
            <div>
              <div className="foot-head">For Travelers</div>
              <Link className="foot-link" to="/inquiry">Plan a trip</Link>
              <Link className="foot-link" to="/stories/wandra">Traveler stories</Link>
              <Link className="foot-link" to="/inv/INV-2026-0001">Pay an invoice</Link>
            </div>
            <div>
              <div className="foot-head">Company</div>
              <a className="foot-link" href="#">About</a>
              <a className="foot-link" href="#">Contact</a>
              <a className="foot-link" href="#">Careers</a>
            </div>
            <div>
              <div className="foot-head">Reach us</div>
              <span className="foot-link">hello@wandra.travel</span>
              <span className="foot-link">+91 78898 04942</span>
              <span className="foot-link">Srinagar · Delhi · Remote</span>
            </div>
          </div>
          <div className="public-foot-bottom">
            <span>© 2026 Wandra. All rights reserved.</span>
            <span>Travel software with everyone.</span>
          </div>
        </div>
      </footer>
      {!onLanding && <a className="wa-float" href="#" title="Chat on WhatsApp"></a>}
    </div>
  )
}
