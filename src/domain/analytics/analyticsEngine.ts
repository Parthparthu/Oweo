import { PersonalTransaction, TransactionCategory } from '@/types/expense'
import { CATEGORY_DEFINITIONS } from '../expenses/categories'
import { formatINR } from '../money/money'

export interface CategorySpending {
  category: TransactionCategory
  label: string
  color: string
  totalPaise: number
  percentage: number
  count: number
}

export interface MonthlySpendingMetrics {
  currentMonthTotalIncomePaise: number
  currentMonthTotalExpensePaise: number
  netCashFlowPaise: number
  previousMonthTotalExpensePaise: number
  monthOverMonthDeltaPaise: number
  monthOverMonthPercentage: number // positive means increased spending
  dailyAverageExpensePaise: number
  daysElapsed: number
  daysInMonth: number
  daysRemaining: number
  projectedMonthEndExpensePaise: number
}

export interface SmartInsight {
  id: string
  type: 'info' | 'warning' | 'positive' | 'trend'
  title: string
  description: string
  category?: TransactionCategory
  actionLabel?: string
}

/**
 * Aggregates only EXPENSE transactions by category.
 */
export function aggregateByCategory(transactions: PersonalTransaction[]): CategorySpending[] {
  const totals: Partial<Record<TransactionCategory, { totalPaise: number; count: number }>> = {}
  let grandTotalPaise = 0

  transactions
    .filter(t => t.type === 'EXPENSE')
    .forEach((e) => {
      grandTotalPaise += e.amountPaise
      if (!totals[e.category]) {
        totals[e.category] = { totalPaise: 0, count: 0 }
      }
      totals[e.category]!.totalPaise += e.amountPaise
      totals[e.category]!.count += 1
    })

  const results: CategorySpending[] = []

  Object.entries(totals).forEach(([catKey, data]) => {
    const category = catKey as TransactionCategory
    const def = CATEGORY_DEFINITIONS[category]
    if (data.totalPaise > 0) {
      const percentage = grandTotalPaise > 0 ? (data.totalPaise / grandTotalPaise) * 100 : 0

      results.push({
        category,
        label: def?.label || category,
        color: def?.color || '#64748b',
        totalPaise: data.totalPaise,
        percentage: Math.round(percentage * 10) / 10,
        count: data.count,
      })
    }
  })

  return results.sort((a, b) => b.totalPaise - a.totalPaise)
}

/**
 * Calculates current and previous month spending metrics with velocity forecasting and cash flow.
 */
export function calculateMonthlyMetrics(
  transactions: PersonalTransaction[],
  optionalReferenceDate: Date = new Date()
): MonthlySpendingMetrics {
  const referenceDate: Date = optionalReferenceDate

  const currentYear = referenceDate.getFullYear()
  const currentMonth = referenceDate.getMonth() // 0-indexed

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const currentDay = Math.min(referenceDate.getDate(), daysInMonth)
  const daysRemaining = Math.max(1, daysInMonth - currentDay)

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const prevYear = prevMonthDate.getFullYear()
  const prevMonth = prevMonthDate.getMonth()

  let currentMonthTotalIncomePaise = 0
  let currentMonthTotalExpensePaise = 0
  let previousMonthTotalExpensePaise = 0

  transactions.forEach((t) => {
    const d = new Date(t.date)
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      if (t.type === 'INCOME') {
        currentMonthTotalIncomePaise += t.amountPaise
      } else {
        currentMonthTotalExpensePaise += t.amountPaise
      }
    } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
      if (t.type === 'EXPENSE') {
        previousMonthTotalExpensePaise += t.amountPaise
      }
    }
  })

  const netCashFlowPaise = currentMonthTotalIncomePaise - currentMonthTotalExpensePaise
  const monthOverMonthDeltaPaise = currentMonthTotalExpensePaise - previousMonthTotalExpensePaise
  const monthOverMonthPercentage =
    previousMonthTotalExpensePaise > 0
      ? ((currentMonthTotalExpensePaise - previousMonthTotalExpensePaise) / previousMonthTotalExpensePaise) * 100
      : 0

  const dailyAverageExpensePaise = currentDay > 0 ? Math.round(currentMonthTotalExpensePaise / currentDay) : 0
  const projectedMonthEndExpensePaise = dailyAverageExpensePaise * daysInMonth

  return {
    currentMonthTotalIncomePaise,
    currentMonthTotalExpensePaise,
    netCashFlowPaise,
    previousMonthTotalExpensePaise,
    monthOverMonthDeltaPaise,
    monthOverMonthPercentage: Math.round(monthOverMonthPercentage * 10) / 10,
    dailyAverageExpensePaise,
    daysElapsed: currentDay,
    daysInMonth,
    daysRemaining,
    projectedMonthEndExpensePaise,
  }
}

/**
 * Produces deep, actionable spending insights explaining 'Why' spending changed, anomaly detection, etc.
 */
export function generateSmartInsights(
  transactions: PersonalTransaction[],
  metrics: MonthlySpendingMetrics,
  referenceDate: Date = new Date()
): SmartInsight[] {
  const insights: SmartInsight[] = []
  const categoryBreakdown = aggregateByCategory(transactions)

  // 1. Spending Anomaly Detection
  const currentMonthExpenses = transactions.filter((t) => {
    const d = new Date(t.date)
    return t.type === 'EXPENSE' && d.getFullYear() === referenceDate.getFullYear() && d.getMonth() === referenceDate.getMonth()
  })

  if (metrics.currentMonthTotalExpensePaise > 0) {
    const largeExpenses = currentMonthExpenses.filter(
      (e) => e.amountPaise >= metrics.currentMonthTotalExpensePaise * 0.3 && e.amountPaise >= 100000
    )
    if (largeExpenses.length > 0) {
      const topExpense = largeExpenses.sort((a, b) => b.amountPaise - a.amountPaise)[0]
      const pct = Math.round((topExpense.amountPaise / metrics.currentMonthTotalExpensePaise) * 100)
      insights.push({
        id: `anomaly-single-${topExpense.id}`,
        type: 'info',
        title: 'Major Single Expense',
        description: `"${topExpense.title}" (${formatINR(topExpense.amountPaise)}) accounted for ${pct}% of your total spending this month.`,
        category: topExpense.category,
      })
    }
  }

  // 2. Month-over-Month Velocity Anomaly
  if (metrics.previousMonthTotalExpensePaise > 0) {
    const isHigher = metrics.monthOverMonthDeltaPaise > 0
    const diffFormatted = formatINR(Math.abs(metrics.monthOverMonthDeltaPaise))
    insights.push({
      id: 'mom-trend',
      type: isHigher ? 'trend' : 'positive',
      title: isHigher ? 'Higher Spending Velocity' : 'Reduced Spending Rate',
      description: isHigher
        ? `You've spent ${diffFormatted} (${Math.abs(metrics.monthOverMonthPercentage)}%) more than this time last month.`
        : `You've spent ${diffFormatted} (${Math.abs(metrics.monthOverMonthPercentage)}%) less than last month.`,
    })
  }

  // 3. Top spending category summary
  if (categoryBreakdown.length > 0 && metrics.currentMonthTotalExpensePaise > 0) {
    const top = categoryBreakdown[0]
    insights.push({
      id: 'top-category',
      type: 'info',
      title: 'Top Category Spending',
      description: `${top.label} is your highest category, representing ${top.percentage}% (${formatINR(top.totalPaise)}) of total expenditure.`,
      category: top.category,
    })
  }

  // 4. Cash flow summary
  if (metrics.currentMonthTotalIncomePaise > 0) {
    insights.push({
      id: 'cash-flow',
      type: metrics.netCashFlowPaise >= 0 ? 'positive' : 'warning',
      title: 'Monthly Cash Flow',
      description: `You have ${metrics.netCashFlowPaise >= 0 ? 'saved' : 'overspent'} ${formatINR(Math.abs(metrics.netCashFlowPaise))} so far this month.`,
    })
  }

  return insights
}
