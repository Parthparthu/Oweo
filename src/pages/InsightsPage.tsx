/**
 * InsightsPage.tsx  (Spending Insights, Forecasting, & Category Budgets)
 */
import React, { useMemo } from 'react'
import { useCombinedExpenses } from '@/hooks/useCombinedExpenses'
import { CategoryDonutChart } from '@/features/insights/CategoryDonutChart'
import { SpendingBarChart } from '@/features/insights/SpendingBarChart'
import { MonthOverMonthCard } from '@/features/insights/MonthOverMonthCard'
import { SmartInsightsList } from '@/features/insights/SmartInsightsList'
import {
  aggregateByCategory,
  calculateMonthlyMetrics,
  generateSmartInsights,
} from '@/domain/analytics/analyticsEngine'
import { EmptyState } from '@/components/ui/EmptyState'
import { PieChart } from 'lucide-react'

export const InsightsPage: React.FC = () => {
  const expenses = useCombinedExpenses()

  const categoryData = useMemo(() => aggregateByCategory(expenses), [expenses])
  const metrics = useMemo(
    () => calculateMonthlyMetrics(expenses),
    [expenses]
  )
  const insights = useMemo(
    () => generateSmartInsights(expenses, metrics),
    [expenses, metrics]
  )

  if (expenses.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Spending Insights
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visual breakdown of your personal &amp; group expenses
          </p>
        </div>
        <EmptyState
          icon={<PieChart className="h-6 w-6" />}
          title="No insights available yet"
          description="Log a personal expense or join a split group to generate category breakdowns, spending trends, and deterministic insights."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          Spending Insights &amp; Analytics
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Factual visualizations of where your money went and why
        </p>
      </div>

      {/* Smart Insights & Observations */}
      <SmartInsightsList insights={insights} />

      {/* Month-over-Month & Velocity Forecasting */}
      <MonthOverMonthCard metrics={metrics} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CategoryDonutChart data={categoryData} />
        <SpendingBarChart data={categoryData} />
      </div>
    </div>
  )
}
