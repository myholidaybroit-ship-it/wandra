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

/* ---- the "did it actually download?" safety net ----
   Browsers only fully trust a download that starts inside the user's click.
   Rendering takes seconds, so the eventual anchor click runs outside that
   activation window and Chrome/Safari can quietly block it as an "automatic
   download" (a tiny icon in the address bar, nothing on the page). JS cannot
   detect a blocked download, so after every export we show a small bar with a
   real link — a fresh click always works — and on failure the same bar says
   why and offers Print → Save as PDF. The bar is plain DOM so every document
   page (invoice, voucher, itinerary, studio) gets it without React plumbing. */
let bar = null
let barTimer = null
let barCleanup = null
function hideBar() {
  clearTimeout(barTimer); barTimer = null
  if (bar) { bar.remove(); bar = null }
  if (barCleanup) { const f = barCleanup; barCleanup = null; f() }
}
function showBar({ text, link, filename, actionLabel, onAction, tone = 'ink', ttl = 60000, cleanup }) {
  hideBar()
  barCleanup = cleanup || null
  bar = document.createElement('div')
  bar.className = 'no-print'
  bar.setAttribute('data-no-pdf', '1')
  bar.setAttribute('role', 'status')
  bar.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:20px', 'transform:translateX(-50%)', 'z-index:9999',
    'display:flex', 'align-items:center', 'gap:12px', 'max-width:calc(100vw - 32px)',
    'padding:10px 12px 10px 16px', 'border-radius:12px',
    `background:${tone === 'error' ? '#d45656' : '#111113'}`, 'color:#fff',
    'font:500 13px/1.4 Inter,system-ui,sans-serif', 'box-shadow:0 12px 32px rgba(0,0,0,.28)',
  ].join(';')
  const msg = document.createElement('span'); msg.textContent = text; bar.appendChild(msg)
  const btnCss = 'appearance:none;border:0;cursor:pointer;white-space:nowrap;padding:7px 12px;border-radius:8px;background:#fff;color:#111113;font:600 13px Inter,system-ui,sans-serif;text-decoration:none'
  if (link) {
    const a = document.createElement('a')
    a.href = link; a.download = filename || 'document.pdf'; a.target = '_blank'; a.rel = 'noopener'
    a.textContent = actionLabel || 'Open PDF'; a.style.cssText = btnCss
    bar.appendChild(a)
  } else if (onAction) {
    const b = document.createElement('button'); b.type = 'button'
    b.textContent = actionLabel || 'Retry'; b.style.cssText = btnCss
    b.onclick = () => { hideBar(); onAction() }
    bar.appendChild(b)
  }
  const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Dismiss')
  x.textContent = '×'; x.style.cssText = 'appearance:none;border:0;background:transparent;color:#fff;opacity:.7;font-size:18px;line-height:1;cursor:pointer;padding:0 2px'
  x.onclick = hideBar
  bar.appendChild(x)
  document.body.appendChild(bar)
  barTimer = setTimeout(hideBar, ttl)
}

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // keep the blob alive while the fallback link is on screen, then release it
  showBar({
    text: `${filename} is ready. Didn't download?`,
    link: url, filename, actionLabel: 'Open PDF',
    cleanup: () => URL.revokeObjectURL(url),
  })
}

/* html2pdf is a lazy chunk. After a deploy, a tab opened before it still asks
   for the OLD chunk name, which no longer exists → the import rejects and the
   button silently does nothing. One reload picks up the new build; the flag
   stops a reload loop if something else is wrong. */
const RELOAD_KEY = 'wandra-pdf-reloaded'
async function loadHtml2pdf() {
  try {
    const mod = await import('html2pdf.js')
    try { sessionStorage.removeItem(RELOAD_KEY) } catch { /* private mode */ }
    return mod.default || mod
  } catch (e) {
    let reloaded = false
    try { reloaded = !!sessionStorage.getItem(RELOAD_KEY); if (!reloaded) sessionStorage.setItem(RELOAD_KEY, '1') } catch { /* ignore */ }
    if (!reloaded && /import|fetch|chunk|module|load/i.test(String(e?.message || e))) {
      window.location.reload()
      await new Promise(() => {})   // never resolves — the page is going away
    }
    throw e
  }
}

export async function downloadElementPdf(el, filename = 'document.pdf') {
  if (!el) return { ok: false }
  hideBar()
  let html2pdf
  try { html2pdf = await loadHtml2pdf() } catch (e) { return failed(e, filename) }

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
        // keep table rows, images and marked blocks from being sliced across a
        // page edge — applies to every doc (invoices/vouchers included, not just flow)
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-avoid', 'tr', 'img'] },
      }).from(el).outputPdf('blob')
      if (blob && blob.size <= MAX_PDF_BYTES) break
    }
    if (!blob || !blob.size) throw new Error('empty PDF')
    saveBlob(blob, filename)   // last ladder step is the floor — save whatever we have
    return { ok: true, filename }
  } catch (e) {
    return failed(e, filename)
  } finally {
    pages.forEach((p, i) => { p.style.cssText = savedPages[i] })
    hidden.forEach((h, i) => { h.style.display = savedHidden[i] })
  }
}

// Never fail silently: say so on screen and offer the browser's own
// Print → Save as PDF, which needs no library at all.
function failed(e, filename) {
  console.error('[pdf] export failed', e)
  showBar({
    tone: 'error', ttl: 90000,
    text: `Couldn't generate ${filename}. Use Print → "Save as PDF" instead.`,
    actionLabel: 'Print', onAction: () => window.print(),
  })
  return { ok: false, error: e }
}

// Inline remote images, preload, then download — the one call most pages use.
export async function preloadAndDownload(el, filename) {
  let restore = () => {}
  try {
    restore = await inlineImages(el)
    await preloadImages(el)
    return await downloadElementPdf(el, filename)
  } catch (e) {
    return failed(e, filename)   // image inlining/preload blew up — still tell the user
  } finally { restore() }
}
