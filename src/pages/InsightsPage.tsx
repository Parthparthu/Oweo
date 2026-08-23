/**
 * InsightsPage.tsx  (Phase 7 — Scroll-Triggered Reveals)
 *
 * Changes vs original:
 *  ✅ All aggregateByCategory, calculateMonthlyMetrics, generateSmartInsights 100% preserved
 *  + Page-level entrance animation
 *  + Header and each section reveal with useIntersectionReveal
 *  + Staggered section entrance delays
 */
import React, { useMemo } from 'react'
import { useCombinedExpenses } from '@/hooks/useCombinedExpenses'
import { useAuthStore } from '@/stores/useAuthStore'
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
import { motion } from 'framer-motion'
import { useIntersectionReveal } from '@/hooks/useIntersectionReveal'

// Individual animated section wrapper
const RevealSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const { ref, isVisible } = useIntersectionReveal<HTMLDivElement>({ threshold: 0.06 })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export const InsightsPage: React.FC = () => {
  const expenses = useCombinedExpenses()
  const profile = useAuthStore((state) => state.profile)

  const categoryData = useMemo(() => aggregateByCategory(expenses), [expenses])
  const metrics = useMemo(
    () => calculateMonthlyMetrics(expenses, profile?.monthlyBudgetPaise || 0),
    [expenses, profile]
  )
  const insights = useMemo(
    () => generateSmartInsights(expenses, metrics),
    [expenses, metrics]
  )

  if (expenses.length === 0) {
    return (
      <motion.div
        className="space-y-6 pb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
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
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-6 pb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <RevealSection>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Spending Insights &amp; Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Factual visualizations of where your money went
          </p>
        </div>
      </RevealSection>

      {/* Smart Insights */}
      <RevealSection delay={0.05}>
        <SmartInsightsList insights={insights} />
      </RevealSection>

      {/* Month-over-Month */}
      <RevealSection delay={0.1}>
        <MonthOverMonthCard metrics={metrics} />
      </RevealSection>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RevealSection delay={0.12}>
          <CategoryDonutChart data={categoryData} />
        </RevealSection>
        <RevealSection delay={0.18}>
          <SpendingBarChart data={categoryData} />
        </RevealSection>
      </div>
    </motion.div>
  )
}
