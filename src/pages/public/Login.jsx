import { useNavigate, Link } from 'react-router-dom'
import './login.css'

const VISUAL = 'https://res.cloudinary.com/dyxxkrq8r/image/upload/w_1600,q_auto,f_auto/v1783197372/beautiful-girl-standing-viewpoint-koh-nangyuan-island-near-koh-tao-island-surat-thani-thailand_1_qz5qy8.jpg'

export default function Login() {
  const nav = useNavigate()
  const go = (e) => { e.preventDefault(); nav('/app') }

  return (
    <div className="lg">
      {/* left — full-height visual */}
      <div className="lg-visual">
        <img src={VISUAL} alt="Traveller overlooking Koh Nangyuan island viewpoint, Thailand" />
        <div className="lg-quote">
          <div className="lg-quote-line">Every great trip starts with a plan.</div>
          <div className="lg-quote-sub">Wandra runs your agency — leads, quotes, bookings & payments in one place.</div>
        </div>
      </div>

      {/* right — minimal form (accounts are provisioned manually) */}
      <div className="lg-panel">
        <div className="lg-box">
          <Link to="/"><img className="lg-logo" src="/brand/wandra-logo.png" alt="Wandra — Travel Software" /></Link>

          <h1 className="lg-title">Welcome back</h1>
          <p className="lg-sub">Log in to your agency dashboard.</p>

          <form className="lg-form" onSubmit={go}>
            <label className="lg-field"><span>Email</span>
              <input type="email" defaultValue="admin@wandra.travel" placeholder="name@agency.com" /></label>
            <label className="lg-field"><span>Password</span>
              <input type="password" defaultValue="demo1234" /></label>
            <button className="lg-submit" type="submit">Log in</button>
          </form>
        </div>
      </div>
    </div>
  )
}
