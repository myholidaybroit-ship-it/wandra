import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { api } from '../../api'
import { PageHeader, Button, Badge, DataTable, Modal, Field, Select } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './users.css'

/* Team is managed by the Wandra team — every user is a paid seat (₹999/user/month,
   the owner counts too). Agencies request add/edit/password/remove via the form. */

const REQUEST_TYPES = ['Add a new user', "Update a user's details", 'Reset a password', 'Remove a user', 'Something else']

const initials = (n) => (n || '?').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function UserManagement() {
  const { users, currentUser, limitFor, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ type: REQUEST_TYPES[0], message: '' })
  const [sending, setSending] = useState(false)

  const isOwner = (u) => u.designation === 'Owner'
  const seatLimit = limitFor('team')
  const seatsUsed = users.length
  const seatsLabel = seatLimit === -1 ? `${seatsUsed} seat${seatsUsed === 1 ? '' : 's'} in use` : `${seatsUsed} of ${seatLimit} seats in use`

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
      toast('Request sent — the Wandra team will handle it for you')
      setForm({ type: REQUEST_TYPES[0], message: '' })
      setOpen(false)
    } catch (e) {
      toast(e.message || 'Could not send the request')
    } finally { setSending(false) }
  }

  const columns = [
    { key: 'name', head: 'Name', render: (r) => (
      <div className="row gap-sm">
        <span className="um-avatar">{initials(r.name)}</span>
        <div>
          <span className="cell-strong">{r.name}</span>
          {isOwner(r) && <span className="um-owner">Owner</span>}
          <div className="cell-sub">{r.email}</div>
        </div>
      </div>
    ) },
    { key: 'role', head: 'Role', render: (r) => <Badge tone="info">{r.role}</Badge> },
    { key: 'designation', head: 'Designation', render: (r) => <span className="cell-sub">{r.designation || '—'}</span> },
    { key: 'department', head: 'Department', render: (r) => <span className="cell-sub">{r.department || '—'}</span> },
    { key: 'status', head: 'Status', render: (r) => (
      <Badge tone={r.status === 'Active' ? 'success' : 'neutral'}>{r.status || 'Active'}</Badge>
    ) },
  ]

  return (
    <div>
      <PageHeader title="User Management"
        subtitle={`Your team's logins, managed for you by the Wandra team. ₹999 per user / month · ${seatsLabel}.`}
        actions={<Button onClick={() => setOpen(true)}>Request a change</Button>} />

      <div className="um-banner">
        <span className="um-banner-ic"><Icon name="users" size={15} /></span>
        <p>
          Every user is a paid seat at <strong>₹999 per user / month</strong> — the owner account counts too.
          To add a teammate, change someone's name, email, role or password, or remove a user —{' '}
          <button className="um-banner-link" onClick={() => setOpen(true)}>send us a request</button> and our operations team will do it for you.
        </p>
      </div>

      <DataTable columns={columns} rows={users} />

      {/* ---------- Request a change ---------- */}
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
            placeholder="e.g. Add Rika Sharma (rika@agency.com) as a Sales user — she joins Monday…" maxLength="5000" />
        </Field>
        <p className="um-modal-note">Your request goes straight to the Wandra team. New users are <strong>₹999 per user / month</strong> — we'll confirm the details with you before making changes.</p>
      </Modal>
    </div>
  )
}
