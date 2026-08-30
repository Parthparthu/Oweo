import { CurrencyCode, SUPPORTED_CURRENCIES } from '@/types/currency'

const RATES_CACHE_KEY = 'oweo_exchange_rates_cache_v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface CachedRates {
  timestamp: number
  ratesToINR: Record<string, number>
}

/**
 * Converts a foreign currency unit (e.g. 15.50 USD) to INR integer paise.
 */
export function convertForeignToPaise(foreignAmount: number, rateToINR: number): number {
  if (foreignAmount <= 0 || rateToINR <= 0) return 0
  // Convert to INR and multiply by 100 for paise, round strictly to nearest integer
  return Math.round(foreignAmount * rateToINR * 100)
}

/**
 * Converts INR integer paise back to foreign currency units.
 */
export function convertPaiseToForeign(paise: number, rateToINR: number): number {
  if (paise <= 0 || rateToINR <= 0) return 0
  const inrRupees = paise / 100
  return Math.round((inrRupees / rateToINR) * 100) / 100
}

/**
 * Formats a foreign amount with its respective symbol.
 */
export function formatForeignCurrency(amount: number, currencyCode: CurrencyCode = 'INR'): string {
  const def = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: def.decimals,
    maximumFractionDigits: def.decimals,
  })
  return `${def.symbol} ${formatted}`
}

/**
 * Retrieves the current exchange rate for a given currency code.
 */
export function getExchangeRateToINR(currencyCode: CurrencyCode): number {
  if (currencyCode === 'INR') return 1

  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY)
    if (cached) {
      const parsed: CachedRates = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.ratesToINR[currencyCode]) {
        return parsed.ratesToINR[currencyCode]
      }
    }
  } catch {
    // fallback
  }

  return SUPPORTED_CURRENCIES[currencyCode]?.defaultRateToINR || 1
}

/**
 * Fetches live exchange rates to INR from public API with fallback to built-in rates.
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error('Failed to fetch rates')

    const data = await res.json()
    if (!data.rates || !data.rates.INR) throw new Error('Invalid rate data')

    const inrPerUSD = data.rates.INR
    const computedRates: Record<string, number> = { INR: 1 }

    Object.keys(SUPPORTED_CURRENCIES).forEach((code) => {
      if (code === 'INR') return
      const perUSD = data.rates[code]
      if (perUSD && perUSD > 0) {
        // 1 Foreign = (inrPerUSD / perUSD) INR
        const rateToINR = Math.round((inrPerUSD / perUSD) * 10000) / 10000
        computedRates[code] = rateToINR
      } else {
        computedRates[code] = SUPPORTED_CURRENCIES[code as CurrencyCode].defaultRateToINR
      }
    })

    const cachePayload: CachedRates = {
      timestamp: Date.now(),
      ratesToINR: computedRates,
    }
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cachePayload))

    return computedRates
  } catch (err) {
    console.warn('Using offline exchange rate table:', err)
    const fallback: Record<string, number> = {}
    Object.entries(SUPPORTED_CURRENCIES).forEach(([code, def]) => {
      fallback[code] = def.defaultRateToINR
    })
    return fallback
  }
}
