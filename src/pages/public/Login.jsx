import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../../store/AppContext'
import { Icon } from '../../components/ui/icons'
import './login.css'

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
      <div className="lg-panel">
        <div className="lg-box">
          <Link to="/"><img className="lg-logo" src="/brand/wandra-logo.png" alt="Wandra — Travel Software" /></Link>

          <div className="lg-card">
            <div className="lg-card-head">
              <h1 className="lg-title">Welcome back</h1>
              <p className="lg-sub">Sign in to your agency workspace.</p>
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

            <div className="lg-note"><Icon name="check" size={13} /> Secure session · Auto-clears on expiry</div>
          </div>
          <p className="lg-help">Need agency access? <Link to="/#demo">Book a demo</Link>.</p>
        </div>
      </div>
    </div>
  )
}
