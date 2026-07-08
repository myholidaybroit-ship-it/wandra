import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import './login.css'

const VISUAL = 'https://res.cloudinary.com/dyxxkrq8r/image/upload/w_1600,q_auto,f_auto/v1783197372/beautiful-girl-standing-viewpoint-koh-nangyuan-island-near-koh-tao-island-surat-thani-thailand_1_qz5qy8.jpg'

export default function Login() {
  const nav = useNavigate()
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const go = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try { await login(email, password); nav('/app') }
    catch (ex) { setErr(ex.message || 'Login failed') }
    finally { setBusy(false) }
  }

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
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@agency.com" required /></label>
            <label className="lg-field"><span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {err && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{err}</div>}
            <button className="lg-submit" type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
