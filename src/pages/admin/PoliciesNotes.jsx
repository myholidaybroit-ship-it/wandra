import { useEffect, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Card, Button, Field, Input } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './policies.css'

/* ============================================================
   Policies & Notes — reusable document blocks (Terms & Conditions,
   Booking / Cancellation policy, Payment details…). Titles and
   content are fully editable; the "Show on PDF" tick controls what
   prints on the quote PDFs, per the agency's own preference.
   ============================================================ */

const uid = () => Math.random().toString(36).slice(2, 9)

const bankText = (agency) => {
  const b = agency?.bank || {}
  const lines = [
    b.accountName && `Account Name: ${b.accountName}`,
    b.bankName && `Bank: ${b.bankName}`,
    b.accountNumber && `Account Number: ${b.accountNumber}`,
    b.ifsc && `IFSC: ${b.ifsc}`,
  ].filter(Boolean)
  return lines.join('\n')
}

const defaultBlocks = (agency) => [
  { id: uid(), title: 'Terms & Conditions', content: '', show: false },
  { id: uid(), title: 'Booking Policy', content: '', show: false },
  { id: uid(), title: 'Cancellation Policy', content: '', show: false },
  { id: uid(), title: 'Payment Details', content: bankText(agency), show: false },
]

export default function PoliciesNotes() {
  const { agency, setAgency, toast } = useApp()
  const [blocks, setBlocks] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!agency || blocks !== null) return
    setBlocks(agency.docBlocks?.length ? agency.docBlocks.map((b) => ({ id: b.id || uid(), ...b })) : defaultBlocks(agency))
  }, [agency]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!blocks) return null

  const upd = (id, patch) => { setDirty(true); setBlocks((l) => l.map((b) => (b.id === id ? { ...b, ...patch } : b))) }
  const remove = (id) => { setDirty(true); setBlocks((l) => l.filter((b) => b.id !== id)) }
  const add = () => { setDirty(true); setBlocks((l) => [...l, { id: uid(), title: 'New block', content: '', show: false }]) }

  const save = async () => {
    if (blocks.some((b) => b.show && !b.content.trim())) return toast('A block ticked for the PDF needs some content')
    setSaving(true)
    try {
      await setAgency({ docBlocks: blocks.map((b) => ({ ...b, title: b.title.trim() || 'Untitled', content: b.content })) })
      setDirty(false)
      toast('Saved — ticked blocks now print on your quote PDFs')
    } catch (e) {
      toast(e.message || 'Could not save')
    } finally { setSaving(false) }
  }

  const shown = blocks.filter((b) => b.show).length

  return (
    <div className="pn">
      <PageHeader title="Policies & Notes"
        subtitle="Terms, policies and payment details for your documents. Tick a block and it prints at the end of every quote PDF."
        actions={<Button onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</Button>} />

      <p className="pn-count">{shown ? `${shown} block${shown === 1 ? '' : 's'} will print on your PDFs.` : 'Nothing is ticked yet — your PDFs print without a policies section.'}</p>

      {blocks.map((b) => (
        <Card key={b.id} className="pn-card">
          <div className="pn-head">
            <Input className="pn-title" value={b.title} onChange={(e) => upd(b.id, { title: e.target.value })} placeholder="Block title — e.g. Cancellation Policy" />
            <label className="lb-switch pn-switch" title="Show on PDF">
              <input type="checkbox" checked={!!b.show} onChange={(e) => upd(b.id, { show: e.target.checked })} />
              <span className="lb-switch-track"><span className="lb-switch-thumb" /></span>
            </label>
            <span className={`pn-show ${b.show ? 'on' : ''}`}>{b.show ? 'On PDF' : 'Hidden'}</span>
            <button className="pn-del" title="Remove block" onClick={() => remove(b.id)}><Icon name="trash" size={14} /></button>
          </div>
          <Field>
            <textarea className="control" rows="4" value={b.content}
              onChange={(e) => upd(b.id, { content: e.target.value })}
              placeholder="The text that prints under this title — one point per line works well." maxLength="4000" />
          </Field>
        </Card>
      ))}

      <Button variant="secondary" onClick={add}>+ Add block</Button>
    </div>
  )
}
