/** Direct wa.me link for a stored phone. Indian 10-digit numbers get the +91
 *  country code; numbers stored with a code keep their own. Multi-phone fields
 *  ("98765…, 91234…") use the first number. */
export function waLink(phone, text = '') {
  const first = String(phone || '').split(',')[0].trim()
  let digits = first.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) digits = '91' + digits
  else if (digits.startsWith('0') && digits.length === 11) digits = '91' + digits.slice(1)
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export default waLink
