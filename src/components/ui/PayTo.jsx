/* ------------------------------------------------------------------
   PayTo — the AGENCY's own bank details + UPI QR, printed on invoices
   (and other pay-me documents) so the client knows where to send money.
   Everything is read from the agency's Settings → Bank Details + UPI
   payment QR (agency.bank + agency.paymentQr). Renders nothing until the
   agency has filled at least one of them.
   ------------------------------------------------------------------ */
export function PayTo({ agency }) {
  const bank = agency?.bank || {}
  const hasBank = bank.accountName || bank.bankName || bank.accountNumber || bank.ifsc
  if (!hasBank && !agency?.paymentQr) return null
  return (
    <div className="inv-pay">
      {hasBank && (
        <div className="inv-pay-details">
          <div className="inv-pay-h">Pay to</div>
          {bank.accountName && <div className="inv-pay-row"><span>Account Name</span><strong>{bank.accountName}</strong></div>}
          {bank.bankName && <div className="inv-pay-row"><span>Bank</span><strong>{bank.bankName}</strong></div>}
          {bank.accountNumber && <div className="inv-pay-row"><span>Account Number</span><strong>{bank.accountNumber}</strong></div>}
          {bank.ifsc && <div className="inv-pay-row"><span>IFSC</span><strong>{bank.ifsc}</strong></div>}
        </div>
      )}
      {agency?.paymentQr && (
        <div className="inv-pay-qr">
          <img src={agency.paymentQr} alt="Scan to pay — UPI QR" />
          <span>Scan to pay via any UPI app</span>
        </div>
      )}
    </div>
  )
}

export default PayTo
