/**
 * Canonical invoice arithmetic — mirrors wandra-backend/src/services/invoiceMath.js.
 * The government-format invoice shows GST and TCS as their own labelled lines,
 * so every screen (create, detail, public, client hub, ledger) must agree.
 */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

export function invoiceBreakup(inv = {}) {
  const items = inv.items || []
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
  const itemTax = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0) * ((Number(it.tax) || 0) / 100), 0)
  const gst = inv.gstAmount != null
    ? Number(inv.gstAmount) || 0
    : (inv.gst && Number(inv.gstPercent) > 0 ? round2(subtotal * Number(inv.gstPercent) / 100) : 0)
  const tcs = inv.tcsAmount != null
    ? Number(inv.tcsAmount) || 0
    : (inv.tcs && Number(inv.tcsPercent) > 0 ? round2((subtotal + itemTax + gst) * Number(inv.tcsPercent) / 100) : 0)
  const total = subtotal + itemTax + gst + tcs
  const paid = (inv.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
  return { subtotal, itemTax, gst, tcs, total, paid, balance: total - paid }
}

export const invoiceTotal = (inv) => invoiceBreakup(inv).total
export const invoicePaid = (inv) => invoiceBreakup(inv).paid

export default invoiceBreakup
