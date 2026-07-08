import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, DataTable, Badge, Button } from '../../../components/ui/UI'

const total = (i) => i.items.reduce((s, it) => s + it.qty * it.rate * (1 + it.tax / 100), 0)
const paid = (i) => (i.payments || []).reduce((s, p) => s + p.amount, 0)

export default function InvoiceList() {
  const { invoices, canSeePricing } = useApp()
  const columns = [
    { key: 'code', head: 'Invoice', render: (r) => <Link to={`/app/invoices/${r.id}`} className="cell-strong c-link mono">{r.code}</Link> },
    { key: 'clientName', head: 'Client' },
    { key: 'type', head: 'Type', render: (r) => <Badge tone="neutral">{r.type}</Badge> },
    { key: 'issueDate', head: 'Issued' },
    ...(canSeePricing ? [
      { key: 'total', head: 'Total', align: 'right', render: (r) => <span className="cell-strong">{inr(total(r))}</span> },
      { key: 'balance', head: 'Balance', align: 'right', render: (r) => <span className="c-error">{inr(total(r) - paid(r))}</span> },
    ] : []),
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Link to={`/app/invoices/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link> },
  ]
  return (
    <div>
      <PageHeader title="Invoices" subtitle="GST & non-GST invoices, payments and balances."
        actions={<><Link to="/app/invoices/settings"><Button variant="secondary">Invoice Settings</Button></Link><Link to="/app/invoices/new"><Button>+ Create Invoice</Button></Link></>} />
      <DataTable columns={columns} rows={invoices} />
    </div>
  )
}
