import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Button, Badge, DataTable, Modal, Field, Input, PillSelect } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './users.css'

const BLANK = { name: '', email: '', password: '', role: 'Sales', phone: '', department: '', designation: '' }
const genPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
const initials = (n) => (n || '?').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function UserManagement() {
  const { users, roles, addUser, updateUser, removeUser, toast } = useApp()
  const roleNames = roles.map((r) => r.name)
  const [open, setOpen] = useState(false)          // add
  const [edit, setEdit] = useState(null)           // edit user (copy)
  const [reset, setReset] = useState(null)         // { user, password }
  const [del, setDel] = useState(null)             // user pending delete
  const [f, setF] = useState(BLANK)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const isOwner = (u) => u.designation === 'Owner'

  const create = () => {
    if (!f.name.trim() || !f.email.trim()) return toast('Name & email required')
    if (!f.password) return toast('Set a password so they can log in — hit generate')
    addUser({ ...f, name: f.name.trim() })
    toast(`${f.name.trim()} added — share their login: ${f.email}`)
    setOpen(false); setF(BLANK)
  }

  const saveEdit = () => {
    if (!edit.name.trim() || !edit.email.trim()) return toast('Name & email required')
    const before = users.find((u) => u.id === edit.id)
    updateUser(edit.id, { ...edit, name: edit.name.trim() })
    toast(before && before.name !== edit.name.trim()
      ? 'User updated — new name synced to lead assignments'
      : 'User updated')
    setEdit(null)
  }

  const toggleStatus = (u) => {
    if (isOwner(u)) return
    const status = u.status === 'Active' ? 'Inactive' : 'Active'
    updateUser(u.id, { status })
    toast(status === 'Inactive' ? `${u.name} deactivated — auto-assignment will skip them` : `${u.name} is active again`)
  }

  const savePassword = () => {
    if (!reset.password || reset.password.length < 6) return toast('Password needs at least 6 characters')
    updateUser(reset.user.id, { password: reset.password })
    navigator.clipboard?.writeText(reset.password)
    toast(`Password reset for ${reset.user.name} — copied to clipboard`)
    setReset(null)
  }

  const confirmDelete = () => {
    removeUser(del.id)
    toast(`${del.name} removed — taken out of every assignment rotation`)
    setDel(null)
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
      <label className={`lb-switch ${isOwner(r) ? 'um-locked' : ''}`} title={isOwner(r) ? 'The owner is always active' : r.status === 'Active' ? 'Deactivate' : 'Activate'}>
        <input type="checkbox" checked={r.status === 'Active'} disabled={isOwner(r)} onChange={() => toggleStatus(r)} />
        <span className="lb-switch-track"><span className="lb-switch-thumb" /></span>
      </label>
    ) },
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="um-acts">
        <button className="um-act" onClick={() => setEdit({ ...r })}>Edit</button>
        <button className="um-act" onClick={() => setReset({ user: r, password: genPassword() })}>Reset password</button>
        {!isOwner(r) && (
          <button className="um-act danger" title="Delete user" onClick={() => setDel(r)}><Icon name="trash" size={13} /></button>
        )}
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="User Management" subtitle="Give staff limited, role-scoped access to their own dashboard."
        actions={<Button onClick={() => { setF({ ...BLANK, password: genPassword() }); setOpen(true) }}>+ Add New User</Button>} />
      <DataTable columns={columns} rows={users} />

      {/* ---------- Add ---------- */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add New User" width={560}
        footer={<><Button variant="tertiary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create User</Button></>}>
        <div className="form-grid">
          <Field label="Name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Rika Sharma" /></Field>
          <Field label="Email" required><Input value={f.email} onChange={set('email')} placeholder="name@agency.com" /></Field>
          <Field label="Password" full hint="They log in with this — hit ↻ for a fresh one, it's copied on create">
            <div className="input-action-row">
              <Input value={f.password} onChange={set('password')} />
              <button className="btn-icon" title="Generate password" onClick={() => setF({ ...f, password: genPassword() })}><Icon name="refresh" size={15} /></button>
            </div>
          </Field>
          <Field label="Role"><PillSelect value={f.role} options={roleNames} onChange={(v) => setF({ ...f, role: v })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Department"><Input value={f.department} onChange={set('department')} /></Field>
          <Field label="Designation"><Input value={f.designation} onChange={set('designation')} /></Field>
        </div>
      </Modal>

      {/* ---------- Edit / rename ---------- */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit User" width={560}
        footer={<><Button variant="tertiary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={saveEdit}>Save Changes</Button></>}>
        {edit && (
          <div className="form-grid">
            <Field label="Name" required hint={isOwner(edit) ? '' : 'Renaming syncs their assignment rotations & leads'}>
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Email" required><Input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Role">
              {isOwner(edit)
                ? <Input value={edit.role} disabled />
                : <PillSelect value={edit.role} options={roleNames} onChange={(v) => setEdit({ ...edit, role: v })} />}
            </Field>
            <Field label="Phone"><Input value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Department"><Input value={edit.department || ''} onChange={(e) => setEdit({ ...edit, department: e.target.value })} /></Field>
            <Field label="Designation"><Input value={edit.designation || ''} onChange={(e) => setEdit({ ...edit, designation: e.target.value })} /></Field>
          </div>
        )}
      </Modal>

      {/* ---------- Reset password ---------- */}
      <Modal open={!!reset} onClose={() => setReset(null)} title="Reset Password" width={460}
        footer={<><Button variant="tertiary" onClick={() => setReset(null)}>Cancel</Button><Button onClick={savePassword}>Reset & Copy</Button></>}>
        {reset && (
          <div className="col gap-base">
            <p className="um-reset-note">Set a new password for <strong>{reset.user.name}</strong> ({reset.user.email}). They'll use it on the login page.</p>
            <Field label="New password">
              <div className="input-action-row">
                <Input value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
                <button className="btn-icon" title="Generate password" onClick={() => setReset({ ...reset, password: genPassword() })}><Icon name="refresh" size={15} /></button>
              </div>
            </Field>
          </div>
        )}
      </Modal>

      {/* ---------- Delete ---------- */}
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete User" width={440}
        footer={<><Button variant="tertiary" onClick={() => setDel(null)}>Cancel</Button><Button onClick={confirmDelete}>Delete User</Button></>}>
        {del && (
          <p className="um-reset-note">Remove <strong>{del.name}</strong>? They'll be taken out of every lead-assignment rotation and can no longer log in. Leads they already own keep their name.</p>
        )}
      </Modal>
    </div>
  )
}
