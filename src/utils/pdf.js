/* ============================================================
   Client-side PDF download (real .pdf file, not the print dialog)
   — html2pdf.js is dynamically imported so it stays out of the
     main bundle until someone actually downloads.
   ============================================================ */
import { API_BASE } from '../api'

/* ---- inline remote images as data URLs before capture ----
   html2canvas silently drops images whose host doesn't answer CORS (S3
   uploads, some stock hosts) or whose cached response lacks CORS headers —
   that's why downloaded PDFs had blank photo boxes. Converting every remote
   image to a data URL first removes the network/CORS question entirely. */
const isRemote = (u) => /^https?:\/\//i.test(u) && !u.startsWith(window.location.origin)

async function toDataUrl(u) {
  const read = (blob) => new Promise((res, rej) => {
    const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob)
  })
  try {
    const r = await fetch(u, { mode: 'cors', cache: 'no-cache' })
    if (r.ok) { const b = await r.blob(); if (b.type.startsWith('image/')) return await read(b) }
  } catch { /* host without CORS — fall through to the backend proxy */ }
  const r2 = await fetch(`${API_BASE}/public/img?u=${encodeURIComponent(u)}`)
  if (!r2.ok) throw new Error('image proxy failed')
  return read(await r2.blob())
}

/** Swap every remote <img> src and CSS background-image inside `el` for a data
    URL. Returns a restore() that puts the originals back after the capture. */
export async function inlineImages(el) {
  if (!el) return () => {}
  const cache = new Map()
  const get = (u) => {
    if (!cache.has(u)) cache.set(u, toDataUrl(u).catch(() => null))
    return cache.get(u)
  }
  const restores = []
  const jobs = []
  el.querySelectorAll('img').forEach((img) => {
    if (!isRemote(img.src)) return
    jobs.push(get(img.src).then((d) => {
      if (!d) return
      const prev = img.getAttribute('src')
      restores.push(() => img.setAttribute('src', prev))
      img.setAttribute('src', d)
    }))
  })
  el.querySelectorAll('*').forEach((n) => {
    const bg = getComputedStyle(n).backgroundImage
    const m = bg && bg.match(/url\(["']?(https?:[^"')]+)["']?\)/i)
    if (!m || !isRemote(m[1])) return
    jobs.push(get(m[1]).then((d) => {
      if (!d) return
      const prev = n.style.backgroundImage
      restores.push(() => { n.style.backgroundImage = prev })
      n.style.backgroundImage = `url("${d}")`
    }))
  })
  await Promise.all(jobs)
  return () => restores.forEach((f) => f())
}

// Resolve every image the element paints (both <img> and CSS background-image)
// and wait for them so html2canvas never snapshots a blank frame.
export function preloadImages(el) {
  if (!el) return Promise.resolve()
  const urls = new Set()
  el.querySelectorAll('img').forEach((i) => { if (i.src) urls.add(i.src) })
  el.querySelectorAll('*').forEach((n) => {
    const bg = getComputedStyle(n).backgroundImage
    const m = bg && bg.match(/url\(["']?(https?:[^"')]+)["']?\)/)
    if (m) urls.add(m[1])
  })
  return Promise.all([...urls].map((u) => new Promise((res) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = res
    img.onerror = res
    img.src = u
    if (img.complete) res()
  })))
}

/* Hard size cap — every exported PDF must stay under 1 MB. The document is
   rendered at descending capture scale / JPEG quality until it fits; the first
   step that fits is saved, so most docs keep the sharpest setting. */
const MAX_PDF_BYTES = 1024 * 1024
const QUALITY_LADDER = [
  { scale: 2, quality: 0.9 },
  { scale: 1.6, quality: 0.8 },
  { scale: 1.35, quality: 0.7 },
  { scale: 1.15, quality: 0.6 },
  { scale: 1, quality: 0.5 },
]

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export async function downloadElementPdf(el, filename = 'document.pdf') {
  if (!el) return
  const mod = await import('html2pdf.js')
  const html2pdf = mod.default || mod

  // A "flow" doc (premium Holiday/Coastal studio) is one continuous sheet whose
  // sections can be reordered freely — jsPDF slices it into A4 pages, so it needs
  // a repeated top/bottom page margin. Fixed-layout docs keep hard page breaks.
  const flow = el.dataset.pdfFlow === '1'
  const pages = [...el.querySelectorAll('.pdf-page')]
  const savedPages = pages.map((p) => p.style.cssText)
  pages.forEach((p, i) => {
    p.style.margin = '0'; p.style.boxShadow = 'none'; p.style.borderRadius = '0'; p.style.minHeight = '0'
    if (!flow) {
      p.style.breakBefore = i > 0 ? 'page' : 'auto'
      p.style.pageBreakBefore = i > 0 ? 'always' : 'auto'
    }
  })
  const hidden = [...el.querySelectorAll('.no-print, [data-no-pdf]')]
  const savedHidden = hidden.map((h) => h.style.display)
  hidden.forEach((h) => { h.style.display = 'none' })

  try {
    let blob = null
    for (const step of QUALITY_LADDER) {
      blob = await html2pdf().set({
        filename,
        margin: flow ? [11, 0, 13, 0] : 0,
        image: { type: 'jpeg', quality: step.quality },
        html2canvas: { scale: step.scale, useCORS: true, backgroundColor: '#ffffff', logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        // 'avoid-all' keeps cards/days/tables from being sliced across a page edge
        pagebreak: flow ? { mode: ['css', 'legacy'], avoid: ['.pdf-avoid', 'tr', 'img'] } : { mode: ['css', 'legacy'] },
      }).from(el).outputPdf('blob')
      if (blob && blob.size <= MAX_PDF_BYTES) break
    }
    saveBlob(blob, filename)   // last ladder step is the floor — save whatever we have
  } finally {
    pages.forEach((p, i) => { p.style.cssText = savedPages[i] })
    hidden.forEach((h, i) => { h.style.display = savedHidden[i] })
  }
}

// Inline remote images, preload, then download — the one call most pages use.
export async function preloadAndDownload(el, filename) {
  const restore = await inlineImages(el)
  try {
    await preloadImages(el)
    await downloadElementPdf(el, filename)
  } finally { restore() }
}
