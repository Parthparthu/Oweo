import { describe, it, expect } from 'vitest'
import {
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  parseAmountInput,
  paiseToInputString,
} from '@/domain/money/money'

describe('Money Engine & Indian Rupee Formatting', () => {
  it('correctly converts rupees to integer paise without floating point issues', () => {
    expect(rupeesToPaise(180)).toBe(18000)
    expect(rupeesToPaise(180.5)).toBe(18050)
    expect(rupeesToPaise(0.01)).toBe(1)
    expect(rupeesToPaise(0.1)).toBe(10)
    expect(rupeesToPaise(999.99)).toBe(99999)
    expect(rupeesToPaise('1,25,000.50')).toBe(12500050)
    expect(rupeesToPaise(0)).toBe(0)
    expect(rupeesToPaise(-10)).toBe(-1000)
  })

  it('correctly converts paise back to rupees', () => {
    expect(paiseToRupees(18000)).toBe(180)
    expect(paiseToRupees(18050)).toBe(180.5)
    expect(paiseToRupees(1)).toBe(0.01)
    expect(paiseToRupees(0)).toBe(0)
  })

  it('formats INR using the Indian numbering system', () => {
    // ₹180
    expect(formatINR(18000)).toMatch(/₹\s?180/)
    // ₹1,250
    expect(formatINR(125000)).toMatch(/₹\s?1,250/)
    // ₹12,500.50
    expect(formatINR(1250050)).toMatch(/₹\s?12,500\.50/)
    // ₹1,25,000
    expect(formatINR(12500000)).toMatch(/₹\s?1,25,000/)
    // Zero
    expect(formatINR(0)).toMatch(/₹\s?0/)
    // Negative
    expect(formatINR(-5000)).toMatch(/-₹\s?50/)
  })

  it('parses user amount input strings safely', () => {
    expect(parseAmountInput('180')).toBe(18000)
    expect(parseAmountInput('₹ 1,250.50')).toBe(125050)
    expect(parseAmountInput('  500  ')).toBe(50000)
    expect(parseAmountInput('')).toBeNull()
    expect(parseAmountInput('abc')).toBeNull()
    expect(parseAmountInput('-50')).toBeNull() // negative disallowed by default
    expect(parseAmountInput('-50', true)).toBe(-5000) // negative allowed
  })

  it('formats paise to editable string', () => {
    expect(paiseToInputString(18000)).toBe('180')
    expect(paiseToInputString(18050)).toBe('180.50')
    expect(paiseToInputString(0)).toBe('')
  })
})
