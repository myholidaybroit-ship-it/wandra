import { useState } from 'react'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Textarea, PillSelect } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'

const MEAL_PLANS = ['EP', 'CP', 'HB', 'MAP', 'AP']
const SERVICE_TYPES = ['Arrival Transfer', 'Departure Transfer', 'Intercity Transfer', 'Sightseeing', 'Excursion', 'Half-day Transfer', 'Full-day Transfer']
const num = (v) => Number(v) || 0
let seq = 0
const rowId = () => `s${++seq}`

const blankService = (kind) => ({ id: rowId(), kind, location: '', serviceType: kind === 'transport' ? 'Sightseeing' : '', description: '', qty: 1, rate: '', given: '' })

export default function ItineraryTemplates() {
  const { templates, destinations, serviceLocations, activities, addItineraryTemplate, updateItineraryTemplate, removeItineraryTemplate, toast } = useApp()
  const activityCats = [...new Set((activities || []).map((a) => a.category))]
  const [edit, setEdit] = useState(null)
  const blank = { name: '', destination: '', mealPlan: 'MAP', description: '', services: [] }
  const openNew = () => setEdit({ ...blank, services: [] })

  const setSvc = (i, patch) => setEdit((e) => ({ ...e, services: e.services.map((s, x) => (x === i ? { ...s, ...patch } : s)) }))
  const addSvc = (kind) => setEdit((e) => ({ ...e, services: [...(e.services || []), blankService(kind)] }))
  const rmSvc = (i) => setEdit((e) => ({ ...e, services: e.services.filter((_, x) => x !== i) }))

  // picking a saved master item autofills the row
  const pickMaster = (i, kind, name) => {
    const list = kind === 'transport' ? serviceLocations : activities
    const it = (list || []).find((x) => x.name === name)
    if (!it) return setSvc(i, { location: name })
    setSvc(i, {
      location: it.name,
      serviceType: kind === 'transport' ? (it.serviceType || '') : (it.category || ''),
      description: it.description || '',
      rate: it.cost != null ? String(it.cost) : '',
      given: it.sell != null ? String(it.sell) : '',
    })
  }

  const save = async () => {
    if (!edit.name.trim()) return toast('Plan name is required')
    const payload = { ...edit, services: (edit.services || []).map(({ id, ...s }) => ({ ...s, qty: num(s.qty), rate: num(s.rate), given: num(s.given) })) }
    if (edit.id) await updateItineraryTemplate(edit.id, payload)
    else await addItineraryTemplate(payload)
    toast(edit.id ? 'Day itinerary updated' : 'Day itinerary saved')
    setEdit(null)
  }
  const remove = async (id) => { await removeItineraryTemplate(id); toast('Day itinerary deleted') }

  return (
    <div>
      <PageHeader title="Day Itineraries" subtitle="Pre-build a day's transfers & activities once, then attach it in the package builder to fill a day instantly."
        actions={<Button onClick={openNew}>+ New Day Itinerary</Button>} />

      {templates.length === 0 && (
        <Card><p className="t-body-sm c-muted">No day itineraries yet. Build one (e.g. “Pattaya City Tour”) with its transfers & activities, and you’ll be able to drop it onto any package day in one click.</p></Card>
      )}

      <div className="grid grid-3">
        {templates.map((t) => (
          <Card key={t.id}>
            <div className="row-between">
              <span className="t-title-sm">{t.name}</span>
              {t.mealPlan && <Badge tone="info">{t.mealPlan}</Badge>}
            </div>
            {t.destination && <div className="t-caption c-muted mt-xs"><Icon name="destinations" size={12} /> {t.destination}</div>}
            {t.description && <p className="t-body-sm c-body mt-xs">{t.description}</p>}
            <div className="t-caption c-muted mt-sm">{(t.services || []).length ? `${t.services.length} service${t.services.length > 1 ? 's' : ''}` : (t.activity || 'No services')}</div>
            {(t.services || []).slice(0, 4).map((s, i) => (
              <div key={i} className="t-body-sm">• {s.location || s.serviceType} <span className="c-muted">({s.kind})</span></div>
            ))}
            <div className="row gap-sm mt-base">
              <Button size="sm" variant="secondary" onClick={() => setEdit({ ...t, services: (t.services || []).map((s) => ({ ...s, id: rowId() })) })}>Edit</Button>
              <Button size="sm" variant="tertiary" onClick={() => remove(t.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Day Itinerary' : 'New Day Itinerary'} width={720}
        footer={<><Button variant="tertiary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (
          <div className="col gap-base">
            <div className="form-grid">
              <Field label="Day name" full><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Pattaya City Tour (Gems Gallery, Big Buddha, View Point)" /></Field>
              <Field label="Destination"><PillSelect value={edit.destination || 'Any destination'} options={['Any destination', ...destinations.map((d) => d.name)]} onChange={(v) => setEdit({ ...edit, destination: v === 'Any destination' ? '' : v })} /></Field>
              <Field label="Meal plan"><PillSelect value={edit.mealPlan || 'MAP'} options={MEAL_PLANS} onChange={(v) => setEdit({ ...edit, mealPlan: v })} /></Field>
              <Field label="Day description" full><Textarea rows={2} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="Short summary shown on the itinerary / PDF" /></Field>
            </div>

            <div>
              <div className="row-between mb-sm">
                <span className="t-body-sm" style={{ fontWeight: 600 }}>Transfers &amp; activities</span>
                <div className="row gap-sm">
                  <Button size="sm" variant="secondary" onClick={() => addSvc('transport')}><Icon name="plus" size={13} /> Transport</Button>
                  <Button size="sm" variant="secondary" onClick={() => addSvc('activity')}><Icon name="plus" size={13} /> Activity</Button>
                </div>
              </div>

              {(edit.services || []).length === 0 && <p className="t-body-sm c-muted">Add the transfers &amp; activities that make up this day. Pick from your Master Data to auto-fill the details.</p>}

              <div className="col gap-sm">
                {(edit.services || []).map((s, i) => {
                  const masterOpts = s.kind === 'transport' ? serviceLocations.map((x) => x.name) : activities.map((x) => x.name)
                  const typeOpts = s.kind === 'transport' ? SERVICE_TYPES : activityCats
                  return (
                    <div key={s.id} style={{ border: '1px solid var(--color-hairline)', borderRadius: 12, padding: 14 }}>
                      <div className="row-between">
                        <Badge tone={s.kind === 'activity' ? 'preview' : 'warning'}>{s.kind === 'activity' ? 'Activity / Ticket' : 'Transport'}</Badge>
                        <button className="c-link t-caption" onClick={() => rmSvc(i)}><Icon name="trash" size={12} /> Remove</button>
                      </div>
                      <div className="form-grid mt-sm">
                        <Field label="Pick from Master Data" full>
                          <PillSelect value={'— pick to auto-fill —'} options={['— pick to auto-fill —', ...masterOpts]} onChange={(v) => v !== '— pick to auto-fill —' && pickMaster(i, s.kind, v)} />
                        </Field>
                        <Field label="Name" full><Input value={s.location} onChange={(e) => setSvc(i, { location: e.target.value })} placeholder={s.kind === 'transport' ? 'e.g. Airport → Hotel transfer' : 'e.g. Coral Island tour'} /></Field>
                        <Field label={s.kind === 'transport' ? 'Service type' : 'Category'}><PillSelect value={s.serviceType || 'Select'} options={['Select', ...typeOpts]} onChange={(v) => setSvc(i, { serviceType: v === 'Select' ? '' : v })} /></Field>
                        <Field label={s.kind === 'activity' ? 'Qty (pax)' : 'Vehicles'}><Input type="number" min="1" value={s.qty} onChange={(e) => setSvc(i, { qty: e.target.value })} /></Field>
                        <Field label="Rate ₹" hint="cost"><Input type="number" value={s.rate} onChange={(e) => setSvc(i, { rate: e.target.value })} placeholder="0" /></Field>
                        <Field label="Given ₹" hint="selling"><Input type="number" value={s.given} onChange={(e) => setSvc(i, { given: e.target.value })} placeholder="0" /></Field>
                        <Field label="Description" full><Input value={s.description || ''} onChange={(e) => setSvc(i, { description: e.target.value })} placeholder="Shown on the quote & voucher" /></Field>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
