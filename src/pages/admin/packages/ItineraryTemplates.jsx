import { useState } from 'react'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Textarea, PillSelect } from '../../../components/ui/UI'

const MEAL_PLANS = ['EP', 'CP', 'HB', 'MAP', 'AP']

export default function ItineraryTemplates() {
  const { templates, addItineraryTemplate, updateItineraryTemplate, removeItineraryTemplate, toast } = useApp()
  const [edit, setEdit] = useState(null)
  const blank = { name: '', mealPlan: 'MAP', activity: '', description: '' }
  const openNew = () => setEdit({ ...blank })
  const save = async () => {
    if (!edit.name.trim()) return toast('Plan name is required')
    if (edit.id) await updateItineraryTemplate(edit.id, edit)
    else await addItineraryTemplate(edit)
    toast(edit.id ? 'Day-wise plan updated' : 'Day-wise plan saved')
    setEdit(null)
  }
  const remove = async (id) => {
    await removeItineraryTemplate(id)
    toast('Day-wise plan deleted')
  }
  return (
    <div>
      <PageHeader title="Itinerary Templates" subtitle="Reusable day templates that auto-fill the day-wise builder."
        actions={<Button onClick={openNew}>+ New Template</Button>} />
      <div className="grid grid-3">
        {templates.map((t) => (
          <Card key={t.id}>
            <div className="row-between"><span className="t-title-sm">{t.name}</span><Badge tone="info">{t.mealPlan}</Badge></div>
            <p className="t-body-sm c-body mt-xs">{t.description}</p>
            <div className="t-caption c-muted mt-sm">Activities</div>
            <div className="t-body-sm">{t.activity}</div>
            <div className="row gap-sm mt-base">
              <Button size="sm" variant="secondary" onClick={() => setEdit({ ...t })}>Edit</Button>
              <Button size="sm" variant="tertiary" onClick={() => remove(t.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Day-wise Plan' : 'New Day-wise Plan'} width={560}
        footer={<><Button variant="tertiary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (
          <div className="form-grid">
            <Field label="Plan name" full><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Srinagar Local Sightseeing" /></Field>
            <Field label="Meal plan"><PillSelect value={edit.mealPlan || 'MAP'} options={MEAL_PLANS} onChange={(v) => setEdit({ ...edit, mealPlan: v })} /></Field>
            <Field label="Activity" full><Input value={edit.activity || ''} onChange={(e) => setEdit({ ...edit, activity: e.target.value })} placeholder="Sightseeing, transfer, leisure..." /></Field>
            <Field label="Description" full><Textarea rows={4} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
