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
              <a className="foot-link" href="/#pricing">Free trial</a>
              <Link className="foot-link" to="/seo/">Destination guides</Link>
            </div>
            <div>
              <div className="foot-head">For Travelers</div>
              <Link className="foot-link" to="/inquiry">Plan a trip</Link>
              <Link className="foot-link" to="/stories/wandra">Traveler stories</Link>
            </div>
            <div>
              <div className="foot-head">Company</div>
              <a className="foot-link" href="/#features">Our workflow</a>
              <a className="foot-link" href="/#demo">Contact</a>
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
            <span>Travel software for modern agencies.</span>
          </div>
        </div>
      </footer>
      {!onLanding && <a className="wa-float" href="#" title="Chat on WhatsApp"></a>}
    </div>
  )
}
