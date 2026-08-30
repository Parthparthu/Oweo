import React from 'react'
import { Card } from '@/components/ui/Card'
import { CategoryBudgetMetric } from '@/domain/analytics/analyticsEngine'
import { formatINR } from '@/domain/money/money'
import { Target, AlertTriangle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

interface Props {
  categoryBudgets: CategoryBudgetMetric[]
}

export const CategoryBudgetsCard: React.FC<Props> = ({ categoryBudgets }) => {
  if (categoryBudgets.length === 0) return null

  return (
    <Card className="p-5 border-border/70 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Category Budgets &amp; Limits
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time consumption and pace indicators
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {categoryBudgets.length} budgets active
        </span>
      </div>

      <div className="space-y-3.5 pt-1">
        {categoryBudgets.map((cat) => {
          const isExceeded = cat.alertLevel === 'exceeded'
          const isCritical = cat.alertLevel === 'critical'
          const isWarning = cat.alertLevel === 'warning'

          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.label}</span>
                  {isExceeded && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                      <AlertCircle className="h-3 w-3" />
                      Exceeded
                    </span>
                  )}
                  {isCritical && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 font-semibold text-[10px]">
                      <AlertTriangle className="h-3 w-3" />
                      {cat.usedPercentage}% used
                    </span>
                  )}
                  {isWarning && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                      {cat.usedPercentage}% used
                    </span>
                  )}
                </div>

                <div className="text-right text-muted-foreground tabular-nums">
                  <strong className="text-foreground font-extrabold">
                    {formatINR(cat.spentPaise)}
                  </strong>{' '}
                  / {formatINR(cat.budgetPaise)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
                <motion.div
                  className={clsx(
                    'h-full rounded-full transition-colors',
                    isExceeded
                      ? 'bg-rose-600 dark:bg-rose-500'
                      : isCritical
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-500'
                      : 'bg-primary'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, cat.usedPercentage)}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>
                  {isExceeded
                    ? `Over by ${formatINR(cat.spentPaise - cat.budgetPaise)}`
                    : `${formatINR(cat.remainingPaise)} remaining`}
                </span>
                <span>{cat.usedPercentage}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
