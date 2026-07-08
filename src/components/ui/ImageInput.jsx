import { useRef, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { Icon } from './icons'

/* ============================================================
   Image upload controls — files are downscaled on-device, then
   uploaded to S3 via the backend; the returned public URL is
   stored (so it maps everywhere). Falls back to a data-URL if
   the upload fails, so the form is never blocked.
   Used across master data forms + the landing page builder.
   ============================================================ */

import { fileToDataUrl } from '../../utils/image'
import { api } from '../../api'

export function ImageInput({ label, value, onChange, maxW = 1600, hint, folder = 'uploads' }) {
  const { toast } = useApp()
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Please choose an image file')
    setLoading(true)
    try {
      const dataUrl = await fileToDataUrl(file, maxW)
      onChange(await api.upload(dataUrl, folder))
      toast('Image uploaded')
    } catch { toast('Could not read that image') } finally { setLoading(false) }
  }
  return (
    <div className="lb-field">
      {label && <span className="lb-k">{label}{hint && <em className="lb-soft">{hint}</em>}</span>}
      <div className="lb-img-row">
        <span className="lb-img-thumb" style={value ? { backgroundImage: `url("${value}")` } : undefined}>
          {!value && <Icon name="gallery" size={16} />}
        </span>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} />
        <button type="button" className="lb-img-btn" onClick={() => fileRef.current?.click()} disabled={loading}>
          <Icon name="upload" size={13} /> {loading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        </button>
        {value && <button type="button" className="lb-img-x" title="Remove image" onClick={() => onChange('')}><Icon name="trash" size={13} /></button>}
      </div>
    </div>
  )
}

/* multiple images (destination galleries etc.) */
export function GalleryInput({ label, value = [], onChange, maxW = 1600, hint, folder = 'gallery' }) {
  const { toast } = useApp()
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const pick = async (e) => {
    const files = [...(e.target.files || [])].filter((f) => f.type.startsWith('image/'))
    e.target.value = ''
    if (!files.length) return
    setLoading(true)
    try {
      const urls = []
      for (const f of files) urls.push(await api.upload(await fileToDataUrl(f, maxW), folder))
      onChange([...value, ...urls])
      toast(`${urls.length} image${urls.length > 1 ? 's' : ''} added`)
    } catch { toast('Could not read those images') } finally { setLoading(false) }
  }
  return (
    <div className="lb-field">
      {label && <span className="lb-k">{label}{hint && <em className="lb-soft">{hint}</em>}</span>}
      <div className="gal-row">
        {value.map((u, i) => (
          <span key={i} className="gal-thumb" style={{ backgroundImage: `url("${u}")` }}>
            <button type="button" className="gal-x" title="Remove" onClick={() => onChange(value.filter((_, x) => x !== i))}>✕</button>
          </span>
        ))}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={pick} />
        <button type="button" className="gal-add" onClick={() => fileRef.current?.click()} disabled={loading}>
          <Icon name="plus" size={15} />{loading ? 'Uploading…' : 'Add'}
        </button>
      </div>
    </div>
  )
}
