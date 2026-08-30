import { describe, it, expect } from 'vitest'
import {
  convertForeignToPaise,
  convertPaiseToForeign,
  formatForeignCurrency,
  getExchangeRateToINR,
} from '@/domain/currency/currencyConverter'

describe('Multi-Currency Converter Engine', () => {
  it('converts foreign currencies to integer INR paise accurately', () => {
    // $10.00 USD @ 83.50 INR/USD = ₹835.00 = 83500 paise
    expect(convertForeignToPaise(10.0, 83.5)).toBe(83500)

    // €15.50 EUR @ 90.50 INR/EUR = ₹1402.75 = 140275 paise
    expect(convertForeignToPaise(15.5, 90.5)).toBe(140275)

    // 1000 JPY @ 0.55 INR/JPY = ₹550.00 = 55000 paise
    expect(convertForeignToPaise(1000, 0.55)).toBe(55000)

    // Zero or negative amounts return 0
    expect(convertForeignToPaise(0, 83.5)).toBe(0)
    expect(convertForeignToPaise(-5, 83.5)).toBe(0)
  })

  it('converts integer paise back to foreign units with 2 decimal precision', () => {
    // 83500 paise (₹835.00) @ 83.50 = $10.00 USD
    expect(convertPaiseToForeign(83500, 83.5)).toBe(10.0)

    // 140275 paise (₹1402.75) @ 90.50 = €15.50 EUR
    expect(convertPaiseToForeign(140275, 90.5)).toBe(15.5)
  })

  it('formats foreign currencies with proper symbols', () => {
    expect(formatForeignCurrency(25.5, 'USD')).toBe('$ 25.50')
    expect(formatForeignCurrency(100, 'EUR')).toBe('€ 100.00')
    expect(formatForeignCurrency(50, 'GBP')).toBe('£ 50.00')
    expect(formatForeignCurrency(1000, 'JPY')).toBe('¥ 1,000')
  })

  it('returns default fallback rate for supported currencies', () => {
    expect(getExchangeRateToINR('INR')).toBe(1)
    expect(getExchangeRateToINR('USD')).toBe(83.5)
    expect(getExchangeRateToINR('EUR')).toBe(90.5)
    expect(getExchangeRateToINR('AED')).toBe(22.75)
  })
})
