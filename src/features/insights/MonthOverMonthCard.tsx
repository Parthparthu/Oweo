import React from 'react'
import { Card } from '@/components/ui/Card'
import { formatINR } from '@/domain/money/money'
import { MonthlySpendingMetrics } from '@/domain/analytics/analyticsEngine'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  metrics: MonthlySpendingMetrics
}

export const MonthOverMonthCard: React.FC<Props> = ({ metrics }) => {
  const isIncreased = metrics.monthOverMonthDeltaPaise > 0
  const absDelta = Math.abs(metrics.monthOverMonthDeltaPaise)

  return (
    <Card className="p-5 border-border/70 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Month-over-Month Comparison
        </h3>
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Current vs Last Month
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
          <span className="text-xs text-muted-foreground font-semibold">This Month</span>
          <p className="text-xl font-black text-foreground mt-0.5">
            {formatINR(metrics.currentMonthTotalPaise)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
          <span className="text-xs text-muted-foreground font-semibold">Last Month</span>
          <p className="text-xl font-black text-foreground mt-0.5">
            {formatINR(metrics.previousMonthTotalPaise)}
          </p>
        </div>
      </div>

      {metrics.previousMonthTotalPaise > 0 && (
        <div
          className={clsx(
            'flex items-center gap-2 p-3 rounded-xl text-xs font-semibold border',
            isIncreased
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
          )}
        >
          {isIncreased ? (
            <TrendingUp className="h-4 w-4 shrink-0" />
          ) : (
            <TrendingDown className="h-4 w-4 shrink-0" />
          )}
          <span>
            You spent <strong>{formatINR(absDelta)}</strong> ({Math.abs(metrics.monthOverMonthPercentage)}%){' '}
            {isIncreased ? 'more' : 'less'} compared to the previous month.
          </span>
        </div>
      )}
    </Card>
  )
}
