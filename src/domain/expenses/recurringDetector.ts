import { PersonalExpense } from '@/types/expense'
import { RecurringExpense, DetectedRecurringPattern, RecurringFrequency } from '@/types/recurring'

/**
 * Automatically identifies recurring payment patterns (e.g. Rent, Netflix, Spotify, Gym)
 * from historical personal expenses.
 */
export function detectRecurringExpenses(
  expenses: PersonalExpense[],
  existingRecurring: RecurringExpense[] = []
): DetectedRecurringPattern[] {
  if (expenses.length < 2) return []

  // Create a map of existing normalized keys to avoid suggesting duplicates
  const existingKeys = new Set(
    existingRecurring.map((r) => `${normalizeTitle(r.title)}_${r.amountPaise}`)
  )

  // Group expenses by normalized title + exact amount
  const grouped: Record<
    string,
    {
      title: string
      category: PersonalExpense['category']
      amountPaise: number
      dates: Date[]
      expenseIds: string[]
    }
  > = {}

  expenses.forEach((e) => {
    const norm = normalizeTitle(e.title)
    if (!norm) return

    const key = `${norm}_${e.amountPaise}`
    if (!grouped[key]) {
      grouped[key] = {
        title: e.title,
        category: e.category,
        amountPaise: e.amountPaise,
        dates: [],
        expenseIds: [],
      }
    }
    grouped[key].dates.push(new Date(e.date))
    grouped[key].expenseIds.push(e.id)
  })

  const detected: DetectedRecurringPattern[] = []

  Object.entries(grouped).forEach(([key, group]) => {
    if (existingKeys.has(key)) return
    if (group.dates.length < 2) return

    // Sort dates ascending
    const sortedDates = [...group.dates].sort((a, b) => a.getTime() - b.getTime())

    // Check if dates span distinct months
    const monthSet = new Set(
      sortedDates.map((d) => `${d.getFullYear()}-${d.getMonth()}`)
    )

    if (monthSet.size >= 2) {
      // Calculate median billing day
      const days = sortedDates.map((d) => d.getDate())
      days.sort((a, b) => a - b)
      const medianDay = days[Math.floor(days.length / 2)]

      // Calculate confidence based on occurrence count and standard deviation of day-of-month
      const dayDiffs = days.map((d) => Math.abs(d - medianDay))
      const avgDeviation = dayDiffs.reduce((a, b) => a + b, 0) / days.length

      let confidence = 0.6 + Math.min(0.3, (monthSet.size - 2) * 0.1)
      if (avgDeviation <= 3) confidence += 0.1
      confidence = Math.min(0.98, Math.round(confidence * 100) / 100)

      detected.push({
        title: group.title,
        category: group.category,
        amountPaise: group.amountPaise,
        frequency: 'monthly' as RecurringFrequency,
        suggestedBillingDay: Math.max(1, Math.min(31, medianDay)),
        occurrences: group.dates.length,
        confidence,
        sampleExpenseIds: group.expenseIds,
      })
    }
  })

  return detected.sort((a, b) => b.confidence - a.confidence)
}

function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
}
