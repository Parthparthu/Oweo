/**
 * PersonalSpendingSummary.tsx  (Phase 5 — Hero Animation)
 *
 * Changes vs original:
 *  ✅ All calculateMonthlyMetrics, formatINR, budget logic 100% preserved
 *  + AnimatedNumber for the hero spending amount
 *  + MotionCard with gradient variant
 *  + Spring-animated progress bar (CSS transition + motion.div width)
 *  + Trend badge pop-in entrance
 *  + Daily average reveals on scroll
 */
import React from 'react'
import { motion } from 'framer-motion'
import { MotionCard } from '@/components/ui/MotionCard'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { formatINR } from '@/domain/money/money'
import { calculateMonthlyMetrics } from '@/domain/analytics/analyticsEngine'
import { PersonalExpense } from '@/types/expense'
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  expenses: PersonalExpense[]
  monthlyBudgetPaise?: number
  onSetBudgetClick?: () => void
}

export const PersonalSpendingSummary: React.FC<Props> = ({
  expenses,
  monthlyBudgetPaise = 0,
  onSetBudgetClick,
}) => {
  const metrics = calculateMonthlyMetrics(expenses, monthlyBudgetPaise)

  const isOverBudget =
    metrics.budgetPaise > 0 && metrics.currentMonthTotalPaise > metrics.budgetPaise

  const budgetPercent = Math.min(metrics.budgetUsedPercentage, 100)

  return (
    <MotionCard
      variant="gradient"
      noReveal
      noHover
      className="p-5 sm:p-6 relative overflow-hidden"
    >
      {/* Subtle top-right glow orb */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
        {/* Total Spent */}
        <div>
          <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Total Spent This Month
          </span>
          <div className="flex flex-wrap items-baseline gap-2 mt-1">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              <AnimatedNumber
                value={metrics.currentMonthTotalPaise}
                stiffness={55}
                damping={14}
                delay={100}
              />
            </h2>

            {/* Month-over-month trend badge */}
            {metrics.previousMonthTotalPaise > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 20 }}
                className={clsx(
                  'flex items-center text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
                  metrics.monthOverMonthDeltaPaise > 0
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                )}
              >
                {metrics.monthOverMonthDeltaPaise > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                <span>
                  {Math.abs(metrics.monthOverMonthPercentage)}% vs last month
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Daily Spending Rate */}
        {metrics.dailyAveragePaise > 0 && (
          <motion.div
            className="sm:text-right bg-muted/40 sm:bg-transparent p-2.5 xs:p-3 sm:p-0 rounded-xl shrink-0"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs font-semibold text-muted-foreground flex items-center sm:justify-end gap-1">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Daily Average
            </span>
            <p className="text-sm xs:text-base sm:text-lg font-bold text-foreground mt-0.5">
              {formatINR(metrics.dailyAveragePaise)}
              <span className="text-xs font-medium text-muted-foreground">/day</span>
            </p>
          </motion.div>
        )}
      </div>

      {/* Budget Section */}
      <div className="mt-5 pt-4 border-t border-border/60">
        {metrics.budgetPaise > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Monthly Budget: <strong>{formatINR(metrics.budgetPaise)}</strong></span>
              </span>
              <motion.span
                key={metrics.budgetRemainingPaise}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={clsx(
                  'font-bold ml-auto',
                  isOverBudget
                    ? 'text-destructive'
                    : metrics.budgetUsedPercentage > 80
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-primary'
                )}
              >
                {isOverBudget
                  ? `Exceeded by ${formatINR(Math.abs(metrics.budgetRemainingPaise))}`
                  : `${formatINR(metrics.budgetRemainingPaise)} remaining`}
              </motion.span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={clsx(
                  'h-full rounded-full',
                  isOverBudget
                    ? 'bg-destructive'
                    : metrics.budgetUsedPercentage > 80
                    ? 'bg-amber-500'
                    : 'bg-primary'
                )}
                initial={{ width: '0%' }}
                animate={{ width: `${budgetPercent}%` }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-1 text-[11px] text-muted-foreground pt-0.5">
              <span>{metrics.budgetUsedPercentage}% used</span>
              {!isOverBudget && metrics.dailyBudgetRemainingPaise > 0 && (
                <span>
                  Recommended: <strong>{formatINR(metrics.dailyBudgetRemainingPaise)}/day</strong>{' '}
                  for {metrics.daysRemaining} days
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Set a monthly spending budget to track remaining allowance.
            </p>
            {onSetBudgetClick && (
              <motion.button
                type="button"
                onClick={onSetBudgetClick}
                className="text-xs font-bold text-primary hover:underline"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                + Set Budget
              </motion.button>
            )}
          </div>
        )}
      </div>
    </MotionCard>
  )
}
