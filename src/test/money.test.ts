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
    expect(rupeesToPaise(0.99)).toBe(99)
    expect(rupeesToPaise(1.0)).toBe(100)
    expect(rupeesToPaise(999.99)).toBe(99999)
    expect(rupeesToPaise(10000.0)).toBe(1000000)
    expect(rupeesToPaise(100000.0)).toBe(10000000)
    expect(rupeesToPaise(1000000.0)).toBe(100000000)
    expect(rupeesToPaise(9999999.99)).toBe(999999999)
    expect(rupeesToPaise('1,25,000.50')).toBe(12500050)
    expect(rupeesToPaise('₹ 99,99,999.99')).toBe(999999999)
    expect(rupeesToPaise(0)).toBe(0)
    expect(rupeesToPaise(-0)).toBe(0)
    expect(rupeesToPaise(-10)).toBe(-1000)
  })

  it('correctly converts paise back to rupees', () => {
    expect(paiseToRupees(18000)).toBe(180)
    expect(paiseToRupees(18050)).toBe(180.5)
    expect(paiseToRupees(1)).toBe(0.01)
    expect(paiseToRupees(10)).toBe(0.1)
    expect(paiseToRupees(99)).toBe(0.99)
    expect(paiseToRupees(100)).toBe(1)
    expect(paiseToRupees(99999)).toBe(999.99)
    expect(paiseToRupees(1000000)).toBe(10000)
    expect(paiseToRupees(10000000)).toBe(100000)
    expect(paiseToRupees(100000000)).toBe(1000000)
    expect(paiseToRupees(999999999)).toBe(9999999.99)
    expect(paiseToRupees(0)).toBe(0)
    expect(paiseToRupees(-0)).toBe(0)
  })

  it('formats INR using the Indian numbering system', () => {
    // ₹0.01
    expect(formatINR(1)).toMatch(/₹\s?0\.01/)
    // ₹0.10
    expect(formatINR(10)).toMatch(/₹\s?0\.10/)
    // ₹0.99
    expect(formatINR(99)).toMatch(/₹\s?0\.99/)
    // ₹1.00
    expect(formatINR(100)).toMatch(/₹\s?1/)
    // ₹180
    expect(formatINR(18000)).toMatch(/₹\s?180/)
    // ₹999.99
    expect(formatINR(99999)).toMatch(/₹\s?999\.99/)
    // ₹1,250
    expect(formatINR(125000)).toMatch(/₹\s?1,250/)
    // ₹10,000
    expect(formatINR(1000000)).toMatch(/₹\s?10,000/)
    // ₹12,500.50
    expect(formatINR(1250050)).toMatch(/₹\s?12,500\.50/)
    // ₹1,00,000
    expect(formatINR(10000000)).toMatch(/₹\s?1,00,000/)
    // ₹10,00,000
    expect(formatINR(100000000)).toMatch(/₹\s?10,00,000/)
    // ₹99,99,999.99
    expect(formatINR(999999999)).toMatch(/₹\s?99,99,999\.99/)
    // ₹1,00,00,000
    expect(formatINR(1000000000)).toMatch(/₹\s?1,00,00,000/)
    // Zero & Negative zero (must never format as -₹0)
    expect(formatINR(0)).toMatch(/₹\s?0/)
    expect(formatINR(-0)).toMatch(/₹\s?0/)
    expect(formatINR(0, { showPaiseIfZero: true })).toMatch(/₹\s?0\.00/)
    // Negative amounts
    expect(formatINR(-5000)).toMatch(/-₹\s?50/)
    expect(formatINR(-5000, { absolute: true })).toMatch(/₹\s?50/)
  })

  it('formats compact representations correctly for dashboards and charts', () => {
    expect(formatINR(100000, { compact: true })).toBe('₹1k')
    expect(formatINR(150000, { compact: true })).toBe('₹1.5k')
    expect(formatINR(10000000, { compact: true })).toBe('₹1 L')
    expect(formatINR(25000000, { compact: true })).toBe('₹2.50 L')
    expect(formatINR(1000000000, { compact: true })).toBe('₹1 Cr')
    expect(formatINR(1500000000, { compact: true })).toBe('₹1.50 Cr')
    expect(formatINR(-25000000, { compact: true })).toBe('-₹2.50 L')
  })

  it('parses user amount input strings safely', () => {
    expect(parseAmountInput('180')).toBe(18000)
    expect(parseAmountInput('₹ 1,250.50')).toBe(125050)
    expect(parseAmountInput('  500  ')).toBe(50000)
    expect(parseAmountInput('10,000.00')).toBe(1000000)
    expect(parseAmountInput('99,99,999.99')).toBe(999999999)
    expect(parseAmountInput('0.01')).toBe(1)
    expect(parseAmountInput('')).toBeNull()
    expect(parseAmountInput('abc')).toBeNull()
    expect(parseAmountInput('-50')).toBeNull() // negative disallowed by default
    expect(parseAmountInput('-50', true)).toBe(-5000) // negative allowed
  })

  it('formats paise to editable string', () => {
    expect(paiseToInputString(18000)).toBe('180')
    expect(paiseToInputString(18050)).toBe('180.50')
    expect(paiseToInputString(0)).toBe('')
    expect(paiseToInputString(-0)).toBe('')
  })
})
