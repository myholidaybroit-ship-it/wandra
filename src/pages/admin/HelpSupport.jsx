import { useApp } from '../../store/AppContext'
import { PageHeader, Card, Button } from '../../components/ui/UI'

export default function HelpSupport() {
  const { agency } = useApp()
  return (
    <div>
      <PageHeader title="Help & Support" subtitle="We're one message away." />
      <div className="grid grid-2">
        <Card dark>
          <span className="t-title-md">Chat on WhatsApp</span>
          <p className="t-body-sm mt-xs" style={{ color: 'var(--color-on-dark-soft)' }}>Talk to us directly and we'll guide you through anything in the software.</p>
          <Button as="a" href="#" className="mt-base">Open WhatsApp ↗</Button>
        </Card>
        <Card>
          <span className="t-title-md">Reach us</span>
          <hr className="divider" />
          <div className="fin-line"><span className="c-body">Email</span><span>{agency.email}</span></div>
          <div className="fin-line"><span className="c-body">Phone</span><span>{agency.phone}</span></div>
          <div className="fin-line"><span className="c-body">Hours</span><span>Mon–Sat, 10am–7pm IST</span></div>
        </Card>
      </div>
    </div>
  )
}
