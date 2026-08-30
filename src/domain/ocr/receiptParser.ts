import { parseAmountInput } from '../money/money'

export interface ReceiptLineItem {
  id: string
  name: string
  pricePaise: number
  claimedByUserIds: string[] // List of userIds who share this item
}

export interface ParsedReceipt {
  merchantName?: string
  date?: string
  items: ReceiptLineItem[]
  subtotalPaise: number
  taxPaise: number
  tipPaise: number
  totalPaise: number
}

export interface MemberItemizedShare {
  userId: string
  itemSubtotalPaise: number
  taxAndTipSharePaise: number
  totalSharePaise: number
  claimedItems: string[]
}

/**
 * Parses raw text extracted from a receipt into structured line items, taxes, tips, and totals.
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  const items: ReceiptLineItem[] = []
  let subtotalPaise = 0
  let taxPaise = 0
  let tipPaise = 0
  let explicitTotalPaise = 0
  let merchantName = lines.length > 0 ? lines[0] : undefined

  // Price match pattern at the end of line (e.g. "Pizza Margherita 450.00" or "Beer  $ 12.50" or "Burger ... 250")
  const priceRegex = /([\d,]+\.?\d*)\s*$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()

    // Check for tax / GST / VAT
    if (lower.includes('tax') || lower.includes('gst') || lower.includes('vat') || lower.includes('service charge')) {
      const match = line.match(priceRegex)
      if (match) {
        const amt = parseAmountInput(match[1].replace(/,/g, ''))
        if (amt && amt > 0) taxPaise += amt
      }
      continue
    }

    // Check for tip / gratuity
    if (lower.includes('tip') || lower.includes('gratuity')) {
      const match = line.match(priceRegex)
      if (match) {
        const amt = parseAmountInput(match[1].replace(/,/g, ''))
        if (amt && amt > 0) tipPaise += amt
      }
      continue
    }

    // Check for subtotal
    if (lower.includes('subtotal') || lower.includes('sub total') || lower.includes('net amount')) {
      const match = line.match(priceRegex)
      if (match) {
        const amt = parseAmountInput(match[1].replace(/,/g, ''))
        if (amt && amt > 0) subtotalPaise = amt
      }
      continue
    }

    // Check for total
    if (lower.includes('total') || lower.includes('grand total') || lower.includes('amount due')) {
      const match = line.match(priceRegex)
      if (match) {
        const amt = parseAmountInput(match[1].replace(/,/g, ''))
        if (amt && amt > 0) explicitTotalPaise = amt
      }
      continue
    }

    // Regular line item candidate
    const priceMatch = line.match(priceRegex)
    if (priceMatch) {
      const priceStr = priceMatch[1].replace(/,/g, '')
      const pricePaise = parseAmountInput(priceStr)

      if (pricePaise && pricePaise > 0) {
        const name = line.substring(0, priceMatch.index).replace(/[\.\:\-_*]/g, '').trim()
        if (name.length > 0) {
          items.push({
            id: `item_${i}_${Date.now()}`,
            name,
            pricePaise,
            claimedByUserIds: [],
          })
        }
      }
    }
  }

  const itemsSumPaise = items.reduce((sum, item) => sum + item.pricePaise, 0)
  const computedSubtotal = subtotalPaise > 0 ? subtotalPaise : itemsSumPaise
  const computedTotal =
    explicitTotalPaise > 0 ? explicitTotalPaise : computedSubtotal + taxPaise + tipPaise

  return {
    merchantName,
    items,
    subtotalPaise: computedSubtotal,
    taxPaise,
    tipPaise,
    totalPaise: computedTotal,
  }
}

/**
 * Calculates exact member shares with mathematical proportional allocation of tax, service charges, and tips.
 * Invariant: sum(memberShares) === totalPaise
 */
export function calculateItemizedShares(
  items: ReceiptLineItem[],
  totalPaise: number,
  allMemberIds: string[]
): Record<string, MemberItemizedShare> {
  const memberSubtotals: Record<string, { paise: number; itemNames: string[] }> = {}
  allMemberIds.forEach((id) => {
    memberSubtotals[id] = { paise: 0, itemNames: [] }
  })

  let totalItemPaiseClaimed = 0

  items.forEach((item) => {
    // If no one explicitly claimed, item is shared among all members
    const claimants = item.claimedByUserIds.length > 0 ? item.claimedByUserIds : allMemberIds
    if (claimants.length === 0) return

    const perPersonBase = Math.floor(item.pricePaise / claimants.length)
    let residue = item.pricePaise - perPersonBase * claimants.length

    claimants.forEach((memberId, idx) => {
      if (!memberSubtotals[memberId]) {
        memberSubtotals[memberId] = { paise: 0, itemNames: [] }
      }
      const share = perPersonBase + (idx < residue ? 1 : 0)
      memberSubtotals[memberId].paise += share
      memberSubtotals[memberId].itemNames.push(item.name)
      totalItemPaiseClaimed += share
    })
  })

  // Distribute difference (tax, tips, discounts) proportionally
  const differencePaise = totalPaise - totalItemPaiseClaimed
  const result: Record<string, MemberItemizedShare> = {}
  let totalDistributedPaise = 0

  allMemberIds.forEach((memberId) => {
    const subtotal = memberSubtotals[memberId]?.paise || 0
    let taxTipShare = 0

    if (totalItemPaiseClaimed > 0) {
      taxTipShare = Math.round((subtotal / totalItemPaiseClaimed) * differencePaise)
    }

    const totalShare = Math.max(0, subtotal + taxTipShare)
    totalDistributedPaise += totalShare

    result[memberId] = {
      userId: memberId,
      itemSubtotalPaise: subtotal,
      taxAndTipSharePaise: taxTipShare,
      totalSharePaise: totalShare,
      claimedItems: memberSubtotals[memberId]?.itemNames || [],
    }
  })

  // Exact residue adjustment to satisfy Paise Conservation Invariant
  let discrepancy = totalPaise - totalDistributedPaise
  if (discrepancy !== 0 && allMemberIds.length > 0) {
    // Give residue paise to the highest spender
    const sortedMembers = [...allMemberIds].sort(
      (a, b) => (result[b]?.totalSharePaise || 0) - (result[a]?.totalSharePaise || 0)
    )
    const target = sortedMembers[0]
    if (result[target]) {
      result[target].totalSharePaise += discrepancy
      result[target].taxAndTipSharePaise += discrepancy
    }
  }

  return result
}
