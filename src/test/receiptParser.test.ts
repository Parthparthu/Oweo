import { describe, it, expect } from 'vitest'
import {
  parseReceiptText,
  calculateItemizedShares,
  ReceiptLineItem,
} from '@/domain/ocr/receiptParser'

describe('OCR Receipt Parser & Itemized Splitting Engine', () => {
  it('parses structured line items, taxes, tips, and subtotals from raw text', () => {
    const rawBill = `Trattoria Mario
1 Margherita Pizza 450.00
1 Veggie Pasta 380.00
2 Garlic Bread 180.00
CGST @ 2.5% 25.25
SGST @ 2.5% 25.25
Tip 50.00
Total 1110.50`

    const parsed = parseReceiptText(rawBill)

    expect(parsed.merchantName).toBe('Trattoria Mario')
    expect(parsed.items).toHaveLength(3)
    expect(parsed.items[0].name).toContain('Margherita Pizza')
    expect(parsed.items[0].pricePaise).toBe(45000)
    expect(parsed.items[1].name).toContain('Veggie Pasta')
    expect(parsed.items[1].pricePaise).toBe(38000)
    expect(parsed.items[2].name).toContain('Garlic Bread')
    expect(parsed.items[2].pricePaise).toBe(18000)

    expect(parsed.taxPaise).toBe(2525 + 2525) // 5050 paise
    expect(parsed.tipPaise).toBe(5000) // 5000 paise
    expect(parsed.totalPaise).toBe(111050)
  })

  it('calculates itemized shares with proportional tax and tip distribution', () => {
    const items: ReceiptLineItem[] = [
      { id: '1', name: 'Pizza', pricePaise: 45000, claimedByUserIds: ['u1'] }, // u1 only (₹450)
      { id: '2', name: 'Pasta', pricePaise: 38000, claimedByUserIds: ['u2'] }, // u2 only (₹380)
      { id: '3', name: 'Garlic Bread', pricePaise: 18000, claimedByUserIds: ['u1', 'u2'] }, // shared (₹90 each)
    ]
    // Item total = 450 + 380 + 180 = 101000 paise (₹1010.00)
    // Total with Tax & Tip = 120000 paise (₹1200.00) => ₹190 tax/tip to be distributed proportionally

    const shares = calculateItemizedShares(items, 120000, ['u1', 'u2'])

    expect(shares['u1']).toBeDefined()
    expect(shares['u2']).toBeDefined()

    // u1 subtotal: 450 + 90 = 540
    // u2 subtotal: 380 + 90 = 470
    expect(shares['u1'].itemSubtotalPaise).toBe(54000)
    expect(shares['u2'].itemSubtotalPaise).toBe(47000)

    // Verify exact sum conservation invariant
    const totalDistributed = shares['u1'].totalSharePaise + shares['u2'].totalSharePaise
    expect(totalDistributed).toBe(120000)
  })

  it('satisfies Exact Paise Conservation Invariant across prime member counts', () => {
    const items: ReceiptLineItem[] = [
      { id: '1', name: 'Appetizer', pricePaise: 33333, claimedByUserIds: ['u1', 'u2', 'u3'] },
      { id: '2', name: 'Main Dish', pricePaise: 77777, claimedByUserIds: ['u1', 'u2', 'u3'] },
    ]
    const totalPaise = 135791 // Odd total

    const shares = calculateItemizedShares(items, totalPaise, ['u1', 'u2', 'u3'])

    const sumShares =
      shares['u1'].totalSharePaise +
      shares['u2'].totalSharePaise +
      shares['u3'].totalSharePaise

    expect(sumShares).toBe(totalPaise)
  })
})
