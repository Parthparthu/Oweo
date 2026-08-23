/**
 * Split Calculations Engine
 * Guarantees zero-remainder loss and exact financial precision using integer paise.
 */

export interface SplitValidationResult {
  isValid: boolean
  shares: Record<string, number> // userId -> amountPaise
  errorMessage?: string
  discrepancyPaise?: number
}

/**
 * Calculates an equal split among participants.
 * Deterministically distributes any leftover 1-paise residue to the first remainder participants.
 * Example: 10000 paise (₹100) / 3 participants -> [3334, 3333, 3333] -> Sum = 10000.
 */
export function calculateEqualSplit(
  totalPaise: number,
  participantIds: string[]
): Record<string, number> {
  const count = participantIds.length
  if (count === 0 || totalPaise <= 0) return {}

  const baseShare = Math.floor(totalPaise / count)
  const remainder = totalPaise % count

  const result: Record<string, number> = {}
  participantIds.forEach((id, index) => {
    // First 'remainder' participants get +1 paise
    result[id] = baseShare + (index < remainder ? 1 : 0)
  })

  return result
}

/**
 * Validates and normalizes custom exact amount splits.
 */
export function validateCustomSplit(
  totalPaise: number,
  sharesPaise: Record<string, number>
): SplitValidationResult {
  const userIds = Object.keys(sharesPaise)
  if (userIds.length === 0) {
    return { isValid: false, shares: {}, errorMessage: 'At least one participant is required' }
  }

  let calculatedSum = 0
  for (const uid of userIds) {
    const share = sharesPaise[uid] || 0
    if (share < 0) {
      return {
        isValid: false,
        shares: sharesPaise,
        errorMessage: 'Participant share cannot be negative',
      }
    }
    calculatedSum += Math.round(share)
  }

  const discrepancy = totalPaise - calculatedSum
  if (discrepancy !== 0) {
    return {
      isValid: false,
      shares: sharesPaise,
      discrepancyPaise: discrepancy,
      errorMessage:
        discrepancy > 0
          ? `₹${(discrepancy / 100).toFixed(2)} remaining to be assigned`
          : `Total exceeds expense by ₹${(Math.abs(discrepancy) / 100).toFixed(2)}`,
    }
  }

  return {
    isValid: true,
    shares: sharesPaise,
  }
}

/**
 * Calculates and validates percentage split.
 * Ensures total percentage equals 100.0% (within 0.01 tolerance) and distributes any rounding residue.
 */
export function calculatePercentageSplit(
  totalPaise: number,
  percentages: Record<string, number> // userId -> percentage (e.g. 25 for 25%)
): SplitValidationResult {
  const userIds = Object.keys(percentages)
  if (userIds.length === 0) {
    return { isValid: false, shares: {}, errorMessage: 'At least one participant is required' }
  }

  let totalPercent = 0
  for (const uid of userIds) {
    const pct = percentages[uid] || 0
    if (pct < 0) {
      return {
        isValid: false,
        shares: {},
        errorMessage: 'Percentage cannot be negative',
      }
    }
    totalPercent += pct
  }

  // Check 100% boundary (allow 0.01% floating-point tolerance from user input)
  const isHundred = Math.abs(totalPercent - 100) < 0.01
  if (!isHundred) {
    const diff = 100 - totalPercent
    return {
      isValid: false,
      shares: {},
      errorMessage: `Percentages sum to ${totalPercent.toFixed(1)}% (${diff > 0 ? `${diff.toFixed(1)}% remaining` : `${Math.abs(diff).toFixed(1)}% over`})`,
    }
  }

  // Calculate raw paise per user
  const shares: Record<string, number> = {}
  let currentSum = 0

  userIds.forEach((uid) => {
    const rawPaise = Math.floor((totalPaise * (percentages[uid] || 0)) / 100)
    shares[uid] = rawPaise
    currentSum += rawPaise
  })

  // Distribute leftover paise residue to participants with highest percentage or first users
  let residue = totalPaise - currentSum
  let idx = 0
  while (residue > 0 && idx < userIds.length) {
    shares[userIds[idx]] += 1
    residue -= 1
    idx += 1
  }

  return {
    isValid: true,
    shares,
  }
}
