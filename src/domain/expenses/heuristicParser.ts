import { ExpenseCategory } from '@/types/expense'
import { CATEGORY_DEFINITIONS } from './categories'

export interface ParsedExpenseIntent {
  amountPaise: number | null
  category: ExpenseCategory
  title: string
  confidence: number // 0 to 1
  rawInput: string
}

/**
 * Heuristic, deterministic local text parser for rapid expense entry.
 * Extracts amounts, detects category keywords, and builds clean titles.
 */
export function parseQuickExpenseInput(input: string): ParsedExpenseIntent {
  const rawInput = input.trim()
  if (!rawInput) {
    return {
      amountPaise: null,
      category: 'Food',
      title: '',
      confidence: 0,
      rawInput,
    }
  }

  // Look for currency symbol or standalone numbers (e.g. 180, 180.50, ₹250, 1,250)
  const amountRegex = /(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)/i
  const amountMatch = rawInput.match(amountRegex)

  let amountPaise: number | null = null
  let textWithoutAmount = rawInput

  if (amountMatch && amountMatch[1]) {
    const rawNumberStr = amountMatch[1].replace(/,/g, '')
    const val = parseFloat(rawNumberStr)
    if (!isNaN(val) && isFinite(val) && val > 0) {
      amountPaise = Math.round(val * 100)
      // Remove the matched amount string from the remainder text
      textWithoutAmount = rawInput.replace(amountMatch[0], '').trim()
    }
  }

  // Clean remaining text for keyword matching
  const lowerText = textWithoutAmount.toLowerCase()
  let bestCategory: ExpenseCategory = 'Other'
  let bestScore = 0

  const categories = Object.keys(CATEGORY_DEFINITIONS) as ExpenseCategory[]

  for (const cat of categories) {
    const meta = CATEGORY_DEFINITIONS[cat]
    for (const keyword of meta.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (regex.test(lowerText) || regex.test(rawInput.toLowerCase())) {
        const score = keyword.length
        if (score > bestScore) {
          bestScore = score
          bestCategory = cat
        }
      }
    }
  }

  // If no category detected, default to 'Food' if amount exists, else 'Other'
  if (bestScore === 0) {
    bestCategory = amountPaise ? 'Food' : 'Other'
  }

  // Capitalize title or fallback to category name
  let title = textWithoutAmount.replace(/^[-—/,\s]+|[-—/,\s]+$/g, '').trim()
  if (!title) {
    title = bestCategory
  } else {
    // Capitalize first character
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  const confidence = (amountPaise ? 0.6 : 0) + (bestScore > 0 ? 0.4 : 0.1)

  return {
    amountPaise,
    category: bestCategory,
    title,
    confidence,
    rawInput,
  }
}
