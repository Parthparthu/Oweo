/**
 * SmartInsightsList.tsx  (Phase 7 — Staggered Insight Cards)
 *
 * Changes vs original:
 *  ✅ All SmartInsight types, icons, styling logic 100% preserved
 *  + StaggerContainer wrapping all insight cards
 *  + Icon spring rotation on hover
 *  + MotionCard-style hover lift on each card
 */
import React from 'react'
import { SmartInsight } from '@/domain/analytics/analyticsEngine'
import { Sparkles, AlertCircle, CheckCircle2, TrendingUp, Info } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'

interface Props {
  insights: SmartInsight[]
}

export const SmartInsightsList: React.FC<Props> = ({ insights }) => {
  if (insights.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: [0, 15, -10, 5, 0] }}
          transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </motion.div>
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Key Spending Observations
        </h3>
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight) => (
          <StaggerItem key={insight.id}>
            <motion.div
              className={clsx(
                'p-4 rounded-2xl border transition-colors space-y-1.5',
                insight.type === 'warning' &&
                  'bg-amber-500/[0.04] border-amber-500/30 text-amber-900 dark:text-amber-200',
                insight.type === 'positive' &&
                  'bg-emerald-500/[0.04] border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
                insight.type === 'trend' &&
                  'bg-indigo-500/[0.04] border-indigo-500/30 text-indigo-900 dark:text-indigo-200',
                insight.type === 'info' && 'bg-card border-border/70 text-foreground'
              )}
              whileHover={{
                y: -2,
                boxShadow: '0 6px 20px -4px rgba(0,0,0,0.08)',
                transition: { duration: 0.2 },
              }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {insight.type === 'warning' && (
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  {insight.type === 'positive' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {insight.type === 'trend' && (
                    <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                  {insight.type === 'info' && (
                    <Info className="h-4 w-4 text-primary shrink-0" />
                  )}
                </motion.div>
                <h4 className="text-xs font-bold text-foreground">{insight.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  )
}
