export interface UPILinkParams {
  payeeVpa?: string // Virtual Payment Address e.g. name@okhdfcbank
  payeeName: string
  amountPaise: number
  transactionNote?: string
}

/**
 * Generates an NPCI-compliant UPI payment intent URI for Indian payment apps
 * (Google Pay, PhonePe, Paytm, BHIM, Cred, etc.).
 */
export function generateUPILink(params: UPILinkParams): string {
  const rupees = (params.amountPaise / 100).toFixed(2)
  const name = encodeURIComponent(params.payeeName.trim() || 'User')
  const note = encodeURIComponent(params.transactionNote?.trim() || 'Oweo Settlement')

  let uri = `upi://pay?pn=${name}&am=${rupees}&cu=INR&tn=${note}`
  if (params.payeeVpa && params.payeeVpa.trim()) {
    uri += `&pa=${encodeURIComponent(params.payeeVpa.trim())}`
  }
  return uri
}

/**
 * Returns QR code image URL for scanning on desktop.
 */
export function generateUPIQRCodeURL(upiUri: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiUri
  )}&margin=10`
}
