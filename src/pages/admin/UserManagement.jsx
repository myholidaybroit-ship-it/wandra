import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Card, Button, Badge, DataTable, Modal, Field, Input, Select } from '../../components/ui/UI'

export default function UserManagement() {
  const { users, addUser, toast } = useApp()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'Sales', phone: '', department: '', designation: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const create = () => { if (!f.name || !f.email) return toast('Name & email required'); addUser(f); toast('User created'); setOpen(false); setF({ name: '', email: '', password: '', role: 'Sales', phone: '', department: '', designation: '' }) }

  const columns = [
    { key: 'name', head: 'Name', render: (r) => <span className="cell-strong">{r.name}</span> },
    { key: 'email', head: 'Email', render: (r) => <span className="cell-sub">{r.email}</span> },
    { key: 'role', head: 'Role', render: (r) => <Badge tone="info">{r.role}</Badge> },
    { key: 'designation', head: 'Designation' },
    { key: 'department', head: 'Department' },
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
  ]
  return (
    <div>
      <PageHeader title="User Management" subtitle="Give staff limited, role-scoped access to their own dashboard."
        actions={<Button onClick={() => setOpen(true)}>+ Add New User</Button>} />
      <DataTable columns={columns} rows={users} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add New User" width={560}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create User</Button></>}>
        <div className="form-grid">
          <Field label="Name" required><Input value={f.name} onChange={set('name')} /></Field>
          <Field label="Email" required><Input value={f.email} onChange={set('email')} /></Field>
          <Field label="Password"><Input value={f.password} onChange={set('password')} type="password" /></Field>
          <Field label="Role"><Select value={f.role} onChange={set('role')}><option>Admin</option><option>Sales</option><option>Operations</option><option>Accounts</option></Select></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Department"><Input value={f.department} onChange={set('department')} /></Field>
          <Field label="Designation" full><Input value={f.designation} onChange={set('designation')} /></Field>
        </div>
      </Modal>
    </div>
  )
}
