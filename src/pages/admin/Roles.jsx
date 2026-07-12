import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { api } from '../../api'
import { PageHeader, Button, Modal, Field, Select } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './roles.css'

const FEATURES = [
  { key: 'dashboard', label: 'Dashboard', desc: 'KPIs, charts & pipeline overview' },
  { key: 'clients', label: 'Trips & Clients', desc: 'Leads, client hub, documents' },
  { key: 'builder', label: 'Quote Builder', desc: 'Create & edit packages, pricing, markup' },
  { key: 'bookings', label: 'Bookings & Payments', desc: 'Confirm trips, record collections' },
  { key: 'invoices', label: 'Invoices', desc: 'Issue invoices, record payments' },
  { key: 'vouchers', label: 'Vouchers', desc: 'Hotel / transport / activity passes' },
  { key: 'master', label: 'Master Data', desc: 'Destinations, hotels, cabs, activities, presets' },
  { key: 'reports', label: 'Reports', desc: 'Lead & revenue analytics, exports' },
  { key: 'landing', label: 'Landing Page', desc: 'Lead-capture site builder' },
  { key: 'settings', label: 'Settings & Billing', desc: 'Agency profile, plan, users' },
  { key: 'viewPricing', label: 'Pricing & Profit', desc: 'See cost, selling price, markup & profit everywhere', pricing: true },
]

const REQUEST_TYPES = ['Add user seats', 'Create a new role', 'Change what a role can access', 'Something else']

export default function Roles() {
  const { roles, users, currentUser, limitFor, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ type: REQUEST_TYPES[0], message: '' })
  const [sending, setSending] = useState(false)

  const members = (roleName) => users.filter((u) => u.role === roleName).length
  const seatLimit = limitFor('team')
  const seatsUsed = users.length

  const submit = async () => {
    if (!form.message.trim()) return toast('Tell us what you need')
    setSending(true)
    try {
      await api.post('/support/inquiries', {
        subject: form.type,
        category: 'Roles & team',
        message: form.message.trim(),
        contactEmail: currentUser?.email || '',
        contactPhone: currentUser?.phone || '',
      })
      toast('Request sent — the Wandra team will set this up for you')
      setForm({ type: REQUEST_TYPES[0], message: '' })
      setOpen(false)
    } catch (e) {
      toast(e.message || 'Could not send the request')
    } finally { setSending(false) }
  }

  return (
    <div className="rl">
      <PageHeader title="Roles & Permissions"
        subtitle="What each role in your team can see and do. Roles are configured for you by the Wandra team."
        actions={<Button onClick={() => setOpen(true)}>Request a change</Button>} />

      <div className="rl-banner">
        <span className="rl-banner-ic"><Icon name="help" size={15} /></span>
        <p>
          Wandra is priced at <strong>₹999 per user / month</strong> — you're using {seatsUsed}{seatLimit === -1 ? '' : ` of ${seatLimit}`} seat{seatsUsed === 1 && seatLimit === -1 ? '' : 's'}.
          Need more seats, a new role, or different access for a role? <button className="rl-banner-link" onClick={() => setOpen(true)}>Send us a request</button> and our team will set it up for you.
        </p>
      </div>

      <div className="rl-card">
        <div className="rl-scroll">
          <table className="rl-table">
            <thead>
              <tr>
                <th className="rl-feat-h">Feature</th>
                {roles.map((r) => (
                  <th key={r.id} className="rl-role-h">
                    <div className="rl-role-name">
                      {r.name}
                      {r.system && <span className="rl-lock" title="System role — always full access"><Icon name="check" size={10} strokeWidth={3} /></span>}
                    </div>
                    <div className="rl-role-sub">{members(r.name)} member{members(r.name) === 1 ? '' : 's'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.key} className={f.pricing ? 'rl-row-pricing' : ''}>
                  <td className="rl-feat">
                    <span className="rl-feat-name">{f.label}</span>
                    <span className="rl-feat-desc">{f.desc}</span>
                  </td>
                  {roles.map((r) => {
                    // pricing visibility defaults ON — it's opt-out; every other perm is opt-in
                    const on = f.pricing ? (r.system || r.perms?.viewPricing !== false) : (r.system || r.perms?.[f.key] === true)
                    return (
                      <td key={r.id} className="rl-cell">
                        {on
                          ? <span className="rl-dot on" title="Included"><Icon name="check" size={11} strokeWidth={3} /></span>
                          : <span className="rl-dot" title="Not included" />}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rl-note">Admin is a system role and always has full access. These permissions are managed by the Wandra team — to add a role or change what a role can access, hit <strong>Request a change</strong> and we'll configure it from our side.</p>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Request a change" width={480}
        footer={<><Button variant="tertiary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={sending}>{sending ? 'Sending…' : 'Send request'}</Button></>}>
        <Field label="What do you need?">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Details">
          <textarea className="control" rows="5" autoFocus value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="e.g. We need a “Vendor Coordinator” role that can only see Vouchers and Master Data…" maxLength="5000" />
        </Field>
        <p className="rl-modal-note">Your request goes straight to the Wandra team. Extra users are <strong>₹999 per user / month</strong> — we'll confirm the details with you before making changes.</p>
      </Modal>
    </div>
  )
}
