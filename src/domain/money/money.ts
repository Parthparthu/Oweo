/**
 * Money utilities using integer minor units (paise) to prevent binary floating-point rounding bugs.
 * 1 Rupee (INR) = 100 Paise.
 */

/**
 * Converts a Rupee amount (e.g. 180.50) into integer Paise (18050).
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const cleaned = rupees.replace(/,/g, '').trim()
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed) || !isFinite(parsed)) return 0
    return Math.round(parsed * 100)
  }
  if (isNaN(rupees) || !isFinite(rupees)) return 0
  return Math.round(rupees * 100)
}

/**
 * Converts integer Paise into decimal Rupee float.
 */
export function paiseToRupees(paise: number): number {
  if (!isFinite(paise) || isNaN(paise)) return 0
  return Math.round(paise) / 100
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
  const isNegative = safePaise < 0
  const val = absolute ? Math.abs(safePaise) : Math.abs(safePaise)
  const rupees = val / 100

  if (compact && rupees >= 10000000) {
    return `${isNegative && !absolute ? '-' : ''}₹${(rupees / 10000000).toFixed(2)} Cr`
  }
  if (compact && rupees >= 100000) {
    return `${isNegative && !absolute ? '-' : ''}₹${(rupees / 100000).toFixed(2)} L`
  }
  if (compact && rupees >= 1000) {
    return `${isNegative && !absolute ? '-' : ''}₹${(rupees / 1000).toFixed(1)}k`
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
  if (!input || input.trim() === '') return null
  const sanitized = input.replace(/[₹,\s]/g, '').trim()
  const num = parseFloat(sanitized)
  if (isNaN(num) || !isFinite(num)) return null
  if (!allowNegative && num < 0) return null
  return Math.round(num * 100)
}

/**
 * Formats a paise number for an editable form input (e.g. 180.5 or 180)
 */
export function paiseToInputString(paise: number): string {
  if (!paise || isNaN(paise)) return ''
  const rupees = paise / 100
  return Number.isInteger(rupees) ? rupees.toString() : rupees.toFixed(2)
}
