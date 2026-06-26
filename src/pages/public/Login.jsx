import { useNavigate } from 'react-router-dom'
import { Card, Button, Field, Input } from '../../components/ui/UI'

export default function Login() {
  const nav = useNavigate()
  return (
    <div className="section" style={{ display: 'grid', placeItems: 'center' }}>
      <Card pad={32} style={{ maxWidth: 420, width: '100%' }}>
        <div className="brand" style={{ marginBottom: 18 }}><span className="pnav-mark">W</span><span className="brand-name" style={{ color: 'var(--color-ink)' }}>Wandra</span></div>
        <h2 className="t-display-sm">Welcome back</h2>
        <p className="t-body-sm c-body mt-xs mb-lg">Log in to your agency dashboard.</p>
        <div className="col gap-base">
          <Field label="Email"><Input defaultValue="admin@wandra.travel" /></Field>
          <Field label="Password"><Input type="password" defaultValue="demo1234" /></Field>
          <Button className="w-full" onClick={() => nav('/app')}>Log In</Button>
          <Button variant="secondary" className="w-full" onClick={() => nav('/app')}>Continue to demo →</Button>
        </div>
      </Card>
    </div>
  )
}
