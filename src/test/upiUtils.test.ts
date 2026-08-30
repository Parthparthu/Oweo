import { describe, it, expect } from 'vitest'
import { generateUPILink, generateUPIQRCodeURL } from '@/utils/upiUtils'

describe('UPI Deep Link Utility', () => {
  it('generates standard upi://pay URI for Indian UPI apps', () => {
    const uri = generateUPILink({
      payeeName: 'Rahul Sharma',
      amountPaise: 45000, // ₹450.00
      transactionNote: 'Oweo Settlement - Goa Trip',
      payeeVpa: 'rahul@okaxis',
    })

    expect(uri).toContain('upi://pay?')
    expect(uri).toContain('pn=Rahul%20Sharma')
    expect(uri).toContain('am=450.00')
    expect(uri).toContain('cu=INR')
    expect(uri).toContain('pa=rahul%40okaxis')
    expect(uri).toContain('tn=Oweo%20Settlement%20-%20Goa%20Trip')
  })

  it('handles optional payee VPA gracefully', () => {
    const uri = generateUPILink({
      payeeName: 'Priya Patel',
      amountPaise: 120050, // ₹1200.50
    })

    expect(uri).toContain('upi://pay?')
    expect(uri).toContain('pn=Priya%20Patel')
    expect(uri).toContain('am=1200.50')
    expect(uri).not.toContain('&pa=')
  })

  it('generates QR code link for desktop users', () => {
    const uri = generateUPILink({
      payeeName: 'Sam',
      amountPaise: 25000,
    })

    const qrUrl = generateUPIQRCodeURL(uri)
    expect(qrUrl).toContain('api.qrserver.com')
    expect(qrUrl).toContain(encodeURIComponent(uri))
  })
})
