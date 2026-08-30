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

export type BudgetAlertLevel = 'normal' | 'warning' | 'critical' | 'exceeded'

export interface CategoryBudgetMetric {
  category: ExpenseCategory
  label: string
  color: string
  budgetPaise: number
  spentPaise: number
  remainingPaise: number
  usedPercentage: number
  alertLevel: BudgetAlertLevel
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
  projectedOverrunDate?: string | null // e.g. "Aug 24" if pace exceeds budget
  budgetPaise: number
  budgetRemainingPaise: number
  budgetUsedPercentage: number
  dailyBudgetRemainingPaise: number
  categoryBudgetMetrics: CategoryBudgetMetric[]
}

export interface SmartInsight {
  id: string
  type: 'info' | 'warning' | 'positive' | 'trend'
  title: string
  description: string
  category?: ExpenseCategory
  actionLabel?: string
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
 * Computes category budget status and alert levels.
 */
export function calculateCategoryBudgetMetrics(
  currentMonthExpenses: PersonalExpense[],
  categoryBudgetsPaise: Record<string, number> = {}
): CategoryBudgetMetric[] {
  const spendingByCategory: Partial<Record<ExpenseCategory, number>> = {}
  currentMonthExpenses.forEach((e) => {
    spendingByCategory[e.category] = (spendingByCategory[e.category] || 0) + e.amountPaise
  })

  const metrics: CategoryBudgetMetric[] = []

  Object.entries(categoryBudgetsPaise).forEach(([catKey, budgetPaise]) => {
    if (budgetPaise <= 0) return
    const category = catKey as ExpenseCategory
    const def = CATEGORY_DEFINITIONS[category]
    const spentPaise = spendingByCategory[category] || 0
    const remainingPaise = Math.max(0, budgetPaise - spentPaise)
    const usedPercentage = Math.round((spentPaise / budgetPaise) * 100)

    let alertLevel: BudgetAlertLevel = 'normal'
    if (usedPercentage >= 100) {
      alertLevel = 'exceeded'
    } else if (usedPercentage >= 90) {
      alertLevel = 'critical'
    } else if (usedPercentage >= 75) {
      alertLevel = 'warning'
    }

    metrics.push({
      category,
      label: def?.label || category,
      color: def?.color || '#64748b',
      budgetPaise,
      spentPaise,
      remainingPaise,
      usedPercentage,
      alertLevel,
    })
  })

  return metrics.sort((a, b) => b.usedPercentage - a.usedPercentage)
}

/**
 * Calculates current and previous month spending metrics with velocity forecasting and category budgets.
 */
export function calculateMonthlyMetrics(
  expenses: PersonalExpense[],
  monthlyBudgetPaise: number = 0,
  categoryBudgetsOrDate: Record<string, number> | Date = {},
  optionalReferenceDate: Date = new Date()
): MonthlySpendingMetrics {
  let categoryBudgetsPaise: Record<string, number> = {}
  let referenceDate: Date = optionalReferenceDate

  if (categoryBudgetsOrDate instanceof Date) {
    referenceDate = categoryBudgetsOrDate
  } else {
    categoryBudgetsPaise = categoryBudgetsOrDate || {}
  }

  const currentYear = referenceDate.getFullYear()
  const currentMonth = referenceDate.getMonth() // 0-indexed

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const currentDay = Math.min(referenceDate.getDate(), daysInMonth)
  const daysRemaining = Math.max(1, daysInMonth - currentDay)

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const prevYear = prevMonthDate.getFullYear()
  const prevMonth = prevMonthDate.getMonth()

  let currentMonthTotalPaise = 0
  let previousMonthTotalPaise = 0
  const currentMonthExpenses: PersonalExpense[] = []

  expenses.forEach((e) => {
    const d = new Date(e.date)
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      currentMonthTotalPaise += e.amountPaise
      currentMonthExpenses.push(e)
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

  let projectedOverrunDate: string | null = null
  if (monthlyBudgetPaise > 0 && dailyAveragePaise > 0) {
    const projectedExhaustionDay = Math.ceil(monthlyBudgetPaise / dailyAveragePaise)
    if (projectedExhaustionDay < daysInMonth && projectedExhaustionDay >= currentDay) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      projectedOverrunDate = `${monthNames[currentMonth]} ${projectedExhaustionDay}`
    }
  }

  const budgetRemainingPaise = Math.max(0, monthlyBudgetPaise - currentMonthTotalPaise)
  const budgetUsedPercentage =
    monthlyBudgetPaise > 0 ? (currentMonthTotalPaise / monthlyBudgetPaise) * 100 : 0
  const dailyBudgetRemainingPaise =
    monthlyBudgetPaise > 0 ? Math.round(budgetRemainingPaise / daysRemaining) : 0

  const categoryBudgetMetrics = calculateCategoryBudgetMetrics(currentMonthExpenses, categoryBudgetsPaise)

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
    projectedOverrunDate,
    budgetPaise: monthlyBudgetPaise,
    budgetRemainingPaise,
    budgetUsedPercentage: Math.round(budgetUsedPercentage * 10) / 10,
    dailyBudgetRemainingPaise,
    categoryBudgetMetrics,
  }
}

/**
 * Produces deep, actionable spending insights explaining 'Why' spending changed,
 * anomaly detection, category budget alerts, and velocity forecasting.
 */
export function generateSmartInsights(
  expenses: PersonalExpense[],
  metrics: MonthlySpendingMetrics,
  referenceDate: Date = new Date()
): SmartInsight[] {
  const insights: SmartInsight[] = []
  const categoryBreakdown = aggregateByCategory(expenses)

  // 1. Category Budget Non-Annoying Alerts (75% warning, 90% critical, 100% exceeded)
  metrics.categoryBudgetMetrics.forEach((catMetric) => {
    if (catMetric.alertLevel === 'exceeded') {
      insights.push({
        id: `cat-budget-exceeded-${catMetric.category}`,
        type: 'warning',
        title: `${catMetric.label} Budget Exceeded`,
        description: `You have spent ${formatINR(catMetric.spentPaise)} of your ${formatINR(catMetric.budgetPaise)} ${catMetric.label} budget (${catMetric.usedPercentage}%).`,
        category: catMetric.category,
      })
    } else if (catMetric.alertLevel === 'critical') {
      insights.push({
        id: `cat-budget-critical-${catMetric.category}`,
        type: 'warning',
        title: `${catMetric.label} Budget at ${catMetric.usedPercentage}%`,
        description: `Only ${formatINR(catMetric.remainingPaise)} left in your ${catMetric.label} budget with ${metrics.daysRemaining} days left in the month.`,
        category: catMetric.category,
      })
    } else if (catMetric.alertLevel === 'warning') {
      insights.push({
        id: `cat-budget-warning-${catMetric.category}`,
        type: 'info',
        title: `${catMetric.label} Budget Milestone`,
        description: `You've used ${catMetric.usedPercentage}% of your ${catMetric.label} budget (${formatINR(catMetric.remainingPaise)} remaining).`,
        category: catMetric.category,
      })
    }
  })

  // 2. Spending Anomaly Detection (Why did spending spike?)
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getFullYear() === referenceDate.getFullYear() && d.getMonth() === referenceDate.getMonth()
  })

  // Look for single large outlier expenses (e.g. >= 30% of total month spend)
  if (metrics.currentMonthTotalPaise > 0) {
    const largeExpenses = currentMonthExpenses.filter(
      (e) => e.amountPaise >= metrics.currentMonthTotalPaise * 0.3 && e.amountPaise >= 100000 // >= 30% and >= ₹1000
    )
    if (largeExpenses.length > 0) {
      const topExpense = largeExpenses.sort((a, b) => b.amountPaise - a.amountPaise)[0]
      const pct = Math.round((topExpense.amountPaise / metrics.currentMonthTotalPaise) * 100)
      insights.push({
        id: `anomaly-single-${topExpense.id}`,
        type: 'info',
        title: 'Major Single Expense',
        description: `"${topExpense.title}" (${formatINR(topExpense.amountPaise)}) accounted for ${pct}% of your total spending this month.`,
        category: topExpense.category,
      })
    }
  }

  // 3. Month-over-Month Velocity & Forecast Anomaly
  if (metrics.previousMonthTotalPaise > 0) {
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

  // 4. End-of-Month Velocity Forecasting & Depletion Prediction
  if (metrics.projectedOverrunDate && metrics.budgetPaise > 0) {
    insights.push({
      id: 'velocity-overrun-warning',
      type: 'warning',
      title: 'Pace Warning: Budget Depletion',
      description: `At your current rate of ${formatINR(metrics.dailyAveragePaise)}/day, your monthly budget will be reached around ${metrics.projectedOverrunDate}.`,
    })
  } else if (metrics.budgetPaise > 0 && metrics.projectedMonthEndPaise <= metrics.budgetPaise) {
    const projectedSavings = metrics.budgetPaise - metrics.projectedMonthEndPaise
    insights.push({
      id: 'velocity-savings-forecast',
      type: 'positive',
      title: 'Projected Monthly Savings',
      description: `At your current pace, you are on track to finish the month with ${formatINR(projectedSavings)} in savings!`,
    })
  }

  // 5. Top spending category summary
  if (categoryBreakdown.length > 0 && metrics.currentMonthTotalPaise > 0) {
    const top = categoryBreakdown[0]
    insights.push({
      id: 'top-category',
      type: 'info',
      title: 'Top Category Spending',
      description: `${top.label} is your highest category, representing ${top.percentage}% (${formatINR(top.totalPaise)}) of total expenditure.`,
      category: top.category,
    })
  }

  return insights
}
