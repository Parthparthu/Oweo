import { PersonalExpense, ExpenseCategory } from '@/types/expense'
import { CATEGORY_DEFINITIONS } from '../expenses/categories'
import { formatINR } from '../money/money'

export interface CategorySpending {
  category: ExpenseCategory
  label: string
  color: string
  totalPaise: number
  percentage: number
  count: number
}

export interface MonthlySpendingMetrics {
  currentMonthTotalPaise: number
  previousMonthTotalPaise: number
  monthOverMonthDeltaPaise: number
  monthOverMonthPercentage: number // positive means increased spending
  dailyAveragePaise: number
  daysElapsed: number
  daysInMonth: number
  daysRemaining: number
  projectedMonthEndPaise: number
  budgetPaise: number
  budgetRemainingPaise: number
  budgetUsedPercentage: number
  dailyBudgetRemainingPaise: number
}

export interface SmartInsight {
  id: string
  type: 'info' | 'warning' | 'positive' | 'trend'
  title: string
  description: string
  category?: ExpenseCategory
}

/**
 * Aggregates expenses by category for a given list of expenses.
 */
export function aggregateByCategory(expenses: PersonalExpense[]): CategorySpending[] {
  const totals: Partial<Record<ExpenseCategory, { totalPaise: number; count: number }>> = {}
  let grandTotalPaise = 0

  expenses.forEach((e) => {
    grandTotalPaise += e.amountPaise
    if (!totals[e.category]) {
      totals[e.category] = { totalPaise: 0, count: 0 }
    }
    totals[e.category]!.totalPaise += e.amountPaise
    totals[e.category]!.count += 1
  })

  const results: CategorySpending[] = []

  Object.entries(totals).forEach(([catKey, data]) => {
    const category = catKey as ExpenseCategory
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
 * Calculates current and previous month spending metrics.
 */
export function calculateMonthlyMetrics(
  expenses: PersonalExpense[],
  monthlyBudgetPaise: number = 0,
  referenceDate: Date = new Date()
): MonthlySpendingMetrics {
  const currentYear = referenceDate.getFullYear()
  const currentMonth = referenceDate.getMonth() // 0-indexed

  // Start & end of current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const currentDay = Math.min(referenceDate.getDate(), daysInMonth)
  const daysRemaining = Math.max(1, daysInMonth - currentDay)

  // Previous month dates
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const prevYear = prevMonthDate.getFullYear()
  const prevMonth = prevMonthDate.getMonth()

  let currentMonthTotalPaise = 0
  let previousMonthTotalPaise = 0

  expenses.forEach((e) => {
    const d = new Date(e.date)
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      currentMonthTotalPaise += e.amountPaise
    } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
      previousMonthTotalPaise += e.amountPaise
    }
  })

  const monthOverMonthDeltaPaise = currentMonthTotalPaise - previousMonthTotalPaise
  const monthOverMonthPercentage =
    previousMonthTotalPaise > 0
      ? ((currentMonthTotalPaise - previousMonthTotalPaise) / previousMonthTotalPaise) * 100
      : 0

  const dailyAveragePaise = currentDay > 0 ? Math.round(currentMonthTotalPaise / currentDay) : 0
  const projectedMonthEndPaise = dailyAveragePaise * daysInMonth

  const budgetRemainingPaise = Math.max(0, monthlyBudgetPaise - currentMonthTotalPaise)
  const budgetUsedPercentage =
    monthlyBudgetPaise > 0 ? (currentMonthTotalPaise / monthlyBudgetPaise) * 100 : 0
  const dailyBudgetRemainingPaise =
    monthlyBudgetPaise > 0 ? Math.round(budgetRemainingPaise / daysRemaining) : 0

  return {
    currentMonthTotalPaise,
    previousMonthTotalPaise,
    monthOverMonthDeltaPaise,
    monthOverMonthPercentage: Math.round(monthOverMonthPercentage * 10) / 10,
    dailyAveragePaise,
    daysElapsed: currentDay,
    daysInMonth,
    daysRemaining,
    projectedMonthEndPaise,
    budgetPaise: monthlyBudgetPaise,
    budgetRemainingPaise,
    budgetUsedPercentage: Math.round(budgetUsedPercentage * 10) / 10,
    dailyBudgetRemainingPaise,
  }
}

/**
 * Produces factual, non-judgmental spending insights based on current metrics and historical data.
 */
export function generateSmartInsights(
  expenses: PersonalExpense[],
  metrics: MonthlySpendingMetrics
): SmartInsight[] {
  const insights: SmartInsight[] = []
  const categoryBreakdown = aggregateByCategory(expenses)

  // 1. Top spending category insight
  if (categoryBreakdown.length > 0 && metrics.currentMonthTotalPaise > 0) {
    const top = categoryBreakdown[0]
    insights.push({
      id: 'top-category',
      type: 'info',
      title: 'Top Category',
      description: `${top.label} accounted for ${top.percentage}% (${formatINR(top.totalPaise)}) of your spending.`,
      category: top.category,
    })
  }

  // 2. Month-over-month trend insight
  if (metrics.previousMonthTotalPaise > 0) {
    const isHigher = metrics.monthOverMonthDeltaPaise > 0
    const diffFormatted = formatINR(Math.abs(metrics.monthOverMonthDeltaPaise))
    insights.push({
      id: 'mom-trend',
      type: isHigher ? 'trend' : 'positive',
      title: isHigher ? 'Higher Monthly Spend' : 'Lower Monthly Spend',
      description: isHigher
        ? `You spent ${diffFormatted} (${Math.abs(metrics.monthOverMonthPercentage)}%) more than last month.`
        : `You spent ${diffFormatted} (${Math.abs(metrics.monthOverMonthPercentage)}%) less than last month.`,
    })
  }

  // 3. Daily spending rate insight
  if (metrics.dailyAveragePaise > 0) {
    insights.push({
      id: 'daily-rate',
      type: 'info',
      title: 'Daily Spending Average',
      description: `Your average daily spending this month is ${formatINR(metrics.dailyAveragePaise)}/day.`,
    })
  }

  // 4. Budget status insight
  if (metrics.budgetPaise > 0) {
    if (metrics.budgetUsedPercentage >= 100) {
      insights.push({
        id: 'budget-exceeded',
        type: 'warning',
        title: 'Budget Limit Reached',
        description: `You have reached 100% of your ${formatINR(metrics.budgetPaise)} monthly budget with ${metrics.daysRemaining} days remaining.`,
      })
    } else if (metrics.budgetUsedPercentage >= 80) {
      insights.push({
        id: 'budget-warning',
        type: 'warning',
        title: 'Budget Milestone',
        description: `You've used ${metrics.budgetUsedPercentage}% of your monthly budget. Recommended remaining daily spend is ${formatINR(metrics.dailyBudgetRemainingPaise)}/day.`,
      })
    } else {
      insights.push({
        id: 'budget-healthy',
        type: 'positive',
        title: 'Budget On Track',
        description: `${formatINR(metrics.budgetRemainingPaise)} remaining for the next ${metrics.daysRemaining} days (${formatINR(metrics.dailyBudgetRemainingPaise)}/day).`,
      })
    }
  }

  return insights
}
