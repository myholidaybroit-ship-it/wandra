import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Button, Modal, Field, Input } from '../../components/ui/UI'
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

export default function Roles() {
  const { roles, users, addRole, removeRole, setRolePerm, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const members = (roleName) => users.filter((u) => u.role === roleName).length

  const create = () => {
    const t = name.trim()
    if (!t) return toast('Give the role a name')
    if (roles.some((r) => r.name.toLowerCase() === t.toLowerCase())) return toast('That role already exists')
    addRole(t)
    toast(`Role “${t}” created — set its permissions below`)
    setName(''); setOpen(false)
  }

  return (
    <div className="rl">
      <PageHeader title="Roles & Permissions"
        subtitle="Decide which parts of Wandra each role can use. Assign roles to teammates in User Management."
        actions={<Button onClick={() => setOpen(true)}>+ New Role</Button>} />

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
                      {!r.system && (
                        <button className="rl-role-x" title="Delete role" onClick={() => { removeRole(r.id); toast(`Role “${r.name}” deleted`) }}>
                          <Icon name="trash" size={12} />
                        </button>
                      )}
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
                        <label className={`lb-switch ${r.system ? 'rl-locked' : ''}`}>
                          <input type="checkbox" checked={on} disabled={r.system}
                            onChange={(e) => { setRolePerm(r.id, f.key, e.target.checked); toast(`${r.name} · ${f.label} ${e.target.checked ? 'enabled' : 'disabled'}`) }} />
                          <span className="lb-switch-track"><span className="lb-switch-thumb" /></span>
                        </label>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rl-note">Admin is a system role and always has full access. <strong>Pricing &amp; Profit</strong> is on by default — turn it off for a role (e.g. Operations) and everyone with that role stops seeing cost, selling price, markup &amp; profit across quotes, packages, bookings, dashboard &amp; reports. Changes apply instantly.</p>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Role" width={440}
        footer={<><Button variant="tertiary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create Role</Button></>}>
        <Field label="Role name" hint="e.g. Sales Manager, Front Desk, Vendor Coordinator">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} placeholder="Role name" />
        </Field>
        <p className="rl-modal-note">New roles start with Dashboard and Trips & Clients — switch on the rest in the matrix.</p>
      </Modal>
    </div>
  )
}
