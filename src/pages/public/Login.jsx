import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import './login.css'

const VISUAL = 'https://res.cloudinary.com/dyxxkrq8r/image/upload/w_1600,q_auto,f_auto/v1783197372/beautiful-girl-standing-viewpoint-koh-nangyuan-island-near-koh-tao-island-surat-thani-thailand_1_qz5qy8.jpg'

export default function Login() {
  const nav = useNavigate()
  const location = useLocation()
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const go = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await login(email, password, { remember })
      nav(location.state?.from || '/app', { replace: true })
    }
    catch (ex) { setErr(ex.message || 'Login failed') }
    finally { setBusy(false) }
  }

  return (
    <div className="lg">
      {/* left — full-height visual */}
      <div className="lg-visual">
        <img src={VISUAL} alt="Traveller overlooking Koh Nangyuan island viewpoint, Thailand" />
        <div className="lg-quote">
          <span className="lg-secure-pill">Secure agency workspace</span>
          <div className="lg-quote-line">Every great trip starts with a plan.</div>
          <div className="lg-quote-sub">Wandra runs your agency — leads, quotes, bookings & payments in one place.</div>
        </div>
      </div>

      {/* right — secure auth card (accounts are provisioned manually) */}
      <div className="lg-panel">
        <div className="lg-box">
          <Link to="/"><img className="lg-logo" src="/brand/wandra-logo.png" alt="Wandra — Travel Software" /></Link>

          <div className="lg-card">
            <div className="lg-card-head">
              <span className="lg-auth-tag">CRM Admin Login</span>
              <h1 className="lg-title">Welcome back</h1>
              <p className="lg-sub">Sign in to your agency dashboard. Your session is verified against the server on every refresh.</p>
            </div>

            <form className="lg-form" onSubmit={go}>
              <label className="lg-field"><span>Email</span>
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@agency.com" required /></label>
              <label className="lg-field"><span>Password</span>
                <span className="lg-password-wrap">
                  <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword((s) => !s)}>{showPassword ? 'Hide' : 'Show'}</button>
                </span>
              </label>
              <label className="lg-remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span><strong>Keep me signed in</strong><em>Use only on a trusted device.</em></span>
              </label>
              {err && <div className="lg-error">{err}</div>}
              <button className="lg-submit" type="submit" disabled={busy}>{busy ? 'Checking session…' : 'Log in securely'}</button>
            </form>

            <div className="lg-security">
              <span>Protected by role permissions</span>
              <span>Auto-clears expired sessions</span>
            </div>
          </div>
          <p className="lg-help">Need trial access? <Link to="/?trial=1">Request an agency account</Link>.</p>
        </div>
      </div>
    </div>
  )
}
