/**
 * Money utilities using integer minor units (paise) to prevent binary floating-point rounding bugs.
 * 1 Rupee (INR) = 100 Paise.
 */

/**
 * Converts a Rupee amount (e.g. 180.50) into integer Paise (18050).
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.replace(/[₹,\s]/g, '').trim()
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed) || !isFinite(parsed)) return 0
    const rounded = Math.round(parsed * 100)
    return Object.is(rounded, -0) ? 0 : rounded
  }
  if (isNaN(rupees) || !isFinite(rupees)) return 0
  const rounded = Math.round(rupees * 100)
  return Object.is(rounded, -0) ? 0 : rounded
}

/**
 * Converts integer Paise into decimal Rupee float.
 */
export function paiseToRupees(paise: number): number {
  if (!isFinite(paise) || isNaN(paise)) return 0
  const rounded = Math.round(paise) / 100
  return Object.is(rounded, -0) ? 0 : rounded
}

/**
 * Formats a paise amount into Indian Rupee string with the ₹ symbol using Indian numbering conventions.
 * Examples:
 *   18000 paise -> ₹180
 *   18050 paise -> ₹180.50
 *   12500000 paise -> ₹1,25,000
 */
export function formatINR(
  paise: number,
  options: {
    showPaiseIfZero?: boolean
    compact?: boolean
    absolute?: boolean
  } = {}
): string {
  const { showPaiseIfZero = false, compact = false, absolute = false } = options
  const safePaise = isFinite(paise) && !isNaN(paise) ? Math.round(paise) : 0
  const normalizedPaise = Object.is(safePaise, -0) || safePaise === 0 ? 0 : safePaise
  const isNegative = normalizedPaise < 0
  const val = Math.abs(normalizedPaise)
  const rupees = val / 100

  const prefix = isNegative && !absolute ? '-' : ''

  if (compact) {
    if (rupees >= 10000000) {
      const cr = rupees / 10000000
      const formatted = cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)
      return `${prefix}₹${formatted} Cr`
    }
    if (rupees >= 100000) {
      const l = rupees / 100000
      const formatted = l % 1 === 0 ? l.toFixed(0) : l.toFixed(2)
      return `${prefix}₹${formatted} L`
    }
    if (rupees >= 1000) {
      const k = rupees / 1000
      const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
      return `${prefix}₹${formatted}k`
    }
  }

  const hasFractions = val % 100 !== 0
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasFractions || showPaiseIfZero ? 2 : 0,
    maximumFractionDigits: 2,
  })

  const formatted = formatter.format(rupees)
  return isNegative && !absolute ? `-${formatted}` : formatted
}

/**
 * Parses user raw numeric input into integer paise safely.
 * Returns null if invalid or negative when not allowed.
 */
export function parseAmountInput(input: string, allowNegative = false): number | null {
  if (!input || typeof input !== 'string' || input.trim() === '') return null
  const sanitized = input.replace(/[₹,\s]/g, '').trim()
  const num = parseFloat(sanitized)
  if (isNaN(num) || !isFinite(num)) return null
  if (!allowNegative && num < 0) return null
  const paise = Math.round(num * 100)
  return Object.is(paise, -0) ? 0 : paise
}

/**
 * Formats a paise number for an editable form input (e.g. 180.5 or 180)
 */
export function paiseToInputString(paise: number): string {
  if (paise === undefined || paise === null || isNaN(paise) || !isFinite(paise)) return ''
  const normalized = Object.is(paise, -0) ? 0 : Math.round(paise)
  if (normalized === 0) return ''
  const rupees = normalized / 100
  return Number.isInteger(rupees) ? rupees.toString() : rupees.toFixed(2)
}

/**
 * Derives current wallet balance in integer paise from a list of transactions:
 * sum(INCOME) - sum(EXPENSE)
 * Strictly preserves integer paise arithmetic.
 */
export function deriveWalletBalance(
  transactions: Array<{ amountPaise?: number; type?: 'INCOME' | 'EXPENSE' }>
): number {
  const total = transactions.reduce((acc, t) => {
    const amount =
      isFinite(t.amountPaise as number) && !isNaN(t.amountPaise as number)
        ? Math.round(t.amountPaise as number)
        : 0
    if (t.type === 'INCOME') {
      return acc + amount
    } else {
      return acc - amount
    }
  }, 0)
  return Object.is(total, -0) ? 0 : total
}

