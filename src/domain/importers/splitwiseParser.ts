import { TransactionCategory } from '@/types/expense'
import { parseAmountInput } from '../money/money'

export interface ParsedSplitwiseExpense {
  id: string
  date: string // YYYY-MM-DD
  title: string
  category: TransactionCategory
  totalAmountPaise: number
  userSharePaise: number
  groupName?: string
  currency: string
  isSettlement: boolean
  note?: string
}

export interface SplitwiseImportPreview {
  totalRows: number
  validExpenses: ParsedSplitwiseExpense[]
  totalVolumePaise: number
  userShareTotalPaise: number
  detectedGroups: string[]
  dateRange: { start: string; end: string }
  skippedCount: number
  errors: string[]
}

const CATEGORY_MAP: Record<string, TransactionCategory> = {
  'dining out': 'Food',
  food: 'Food',
  groceries: 'Groceries',
  supermarket: 'Groceries',
  taxi: 'Travel',
  bus: 'Travel',
  train: 'Travel',
  flight: 'Travel',
  transportation: 'Travel',
  travel: 'Travel',
  rent: 'Rent',
  'rent/mortgage': 'Rent',
  mortgage: 'Rent',
  utilities: 'Bills',
  electricity: 'Bills',
  water: 'Bills',
  internet: 'Bills',
  broadband: 'Bills',
  bills: 'Bills',
  entertainment: 'Entertainment',
  movies: 'Entertainment',
  games: 'Entertainment',
  shopping: 'Shopping',
  clothing: 'Shopping',
  electronics: 'Shopping',
  health: 'Health',
  medical: 'Health',
  doctor: 'Health',
  pharmacy: 'Health',
  education: 'Education',
  courses: 'Education',
  books: 'Education',
  gifts: 'Gifts',
  gift: 'Gifts',
  donations: 'Gifts',
  subscriptions: 'Subscriptions',
  streaming: 'Subscriptions',
  memberships: 'Subscriptions',
}

/**
 * Robust RFC 4180 CSV line parser supporting quoted fields and embedded commas.
 */
export function parseCSVLines(csvText: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        currentRow.push(currentField.trim())
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow)
        }
        currentRow = []
        currentField = ''
      } else {
        currentField += char
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow)
    }
  }

  return rows
}

/**
 * Normalizes date string into YYYY-MM-DD.
 */
function normalizeDate(raw: string): string {
  if (!raw) return new Date().toISOString().split('T')[0]

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return raw.trim()
  }

  const parsed = new Date(raw)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return new Date().toISOString().split('T')[0]
}

/**
 * Maps raw Splitwise category string to Oweo TransactionCategory.
 */
function mapCategory(rawCat: string): TransactionCategory {
  if (!rawCat) return 'Other'
  const lower = rawCat.toLowerCase().trim()
  return CATEGORY_MAP[lower] || 'Other'
}

/**
 * Parses Splitwise CSV export into a structured preview without modifying state.
 */
export function parseSplitwiseCSV(csvText: string): SplitwiseImportPreview {
  const rows = parseCSVLines(csvText)
  const errors: string[] = []

  if (rows.length < 2) {
    return {
      totalRows: 0,
      validExpenses: [],
      totalVolumePaise: 0,
      userShareTotalPaise: 0,
      detectedGroups: [],
      dateRange: { start: '', end: '' },
      skippedCount: 0,
      errors: ['CSV file is empty or does not contain a header row.'],
    }
  }

  const headers = rows[0].map((h) => h.toLowerCase())

  // Find column indices
  const dateIdx = headers.findIndex((h) => h === 'date')
  const descIdx = headers.findIndex((h) => h === 'description' || h === 'title')
  const catIdx = headers.findIndex((h) => h === 'category')
  const costIdx = headers.findIndex((h) => h === 'cost' || h === 'amount')
  const currencyIdx = headers.findIndex((h) => h === 'currency')
  const groupIdx = headers.findIndex((h) => h === 'group' || h === 'group name')

  if (descIdx === -1 || costIdx === -1) {
    return {
      totalRows: rows.length - 1,
      validExpenses: [],
      totalVolumePaise: 0,
      userShareTotalPaise: 0,
      detectedGroups: [],
      dateRange: { start: '', end: '' },
      skippedCount: rows.length - 1,
      errors: [
        'Invalid Splitwise CSV format. Headers must include at least "Description" and "Cost".',
      ],
    }
  }

  const validExpenses: ParsedSplitwiseExpense[] = []
  const groupsSet = new Set<string>()
  let totalVolumePaise = 0
  let userShareTotalPaise = 0
  let skippedCount = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length <= Math.max(descIdx, costIdx)) {
      skippedCount++
      continue
    }

    const title = row[descIdx] || 'Expense'
    const rawCost = row[costIdx]
    const date = dateIdx !== -1 ? normalizeDate(row[dateIdx]) : new Date().toISOString().split('T')[0]
    const category = catIdx !== -1 ? mapCategory(row[catIdx]) : 'Other'
    const currency = currencyIdx !== -1 ? row[currencyIdx] || 'INR' : 'INR'
    const groupName = groupIdx !== -1 && row[groupIdx] ? row[groupIdx].trim() : undefined

    // Skip balance settlement summaries if explicitly named
    const isSettlement =
      title.toLowerCase().includes('settle all balances') ||
      title.toLowerCase().includes('payment') ||
      title.toLowerCase().includes('settlement')

    // Parse amount
    const parsedPaise = parseAmountInput(rawCost.replace(/[^0-9.]/g, ''))
    if (!parsedPaise || parsedPaise <= 0) {
      skippedCount++
      continue
    }

    if (groupName && groupName.toLowerCase() !== 'non-group expenses') {
      groupsSet.add(groupName)
    }

    const expenseItem: ParsedSplitwiseExpense = {
      id: `sw_${i}_${Date.now()}`,
      date,
      title,
      category,
      totalAmountPaise: parsedPaise,
      userSharePaise: parsedPaise,
      groupName,
      currency,
      isSettlement,
    }

    validExpenses.push(expenseItem)
    totalVolumePaise += parsedPaise
    userShareTotalPaise += parsedPaise
  }

  // Determine date range
  validExpenses.sort((a, b) => a.date.localeCompare(b.date))
  const startDate = validExpenses.length > 0 ? validExpenses[0].date : ''
  const endDate = validExpenses.length > 0 ? validExpenses[validExpenses.length - 1].date : ''

  return {
    totalRows: rows.length - 1,
    validExpenses,
    totalVolumePaise,
    userShareTotalPaise,
    detectedGroups: Array.from(groupsSet),
    dateRange: { start: startDate, end: endDate },
    skippedCount,
    errors,
  }
}
