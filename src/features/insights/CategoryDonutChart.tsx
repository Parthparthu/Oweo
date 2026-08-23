/**
 * CategoryDonutChart.tsx  (Phase 7 — Animated Chart)
 *
 * Changes vs original:
 *  ✅ All Recharts PieChart, data aggregation, tooltip 100% preserved
 *  + MotionCard with scroll-triggered reveal
 *  + Legend items stagger in
 *  + Tooltip glassmorphism enhanced
 */
import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { CategorySpending } from '@/domain/analytics/analyticsEngine'
import { formatINR } from '@/domain/money/money'
import { MotionCard } from '@/components/ui/MotionCard'
import { Card } from '@/components/ui/Card'
import { PieChart as PieIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  data: CategorySpending[]
}

export const CategoryDonutChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card className="p-6 text-center space-y-2 border-border/70">
        <PieIcon className="h-8 w-8 text-muted-foreground mx-auto" />
        <h4 className="text-sm font-bold text-foreground">No Spending Data</h4>
        <p className="text-xs text-muted-foreground">
          Record your first expenses to see category breakdown.
        </p>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    name: d.label,
    value: d.totalPaise / 100,
    color: d.color,
    percentage: d.percentage,
    totalPaise: d.totalPaise,
  }))

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: typeof chartData[0] }[] }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-card/95 border border-border p-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs font-semibold">
          <p className="text-foreground font-bold">{item.name}</p>
          <p className="text-primary font-black mt-0.5">
            {formatINR(item.totalPaise)} ({item.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <MotionCard className="p-5 border-border/70 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Spending by Category
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {data.length} categories
        </span>
      </div>

      <div className="h-52 xs:h-56 sm:h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              animationBegin={200}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Legend list — staggered with accessible financial summary */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 pt-2 border-t border-border/60">
        {data.slice(0, 6).map((item, i) => (
          <motion.div
            key={item.category}
            className="flex items-center gap-2 text-xs"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.055, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-semibold text-foreground truncate min-w-0 flex-1">{item.label}</span>
            <span className="text-muted-foreground ml-auto font-bold shrink-0 tabular-nums">
              {formatINR(item.totalPaise)} ({item.percentage}%)
            </span>
          </motion.div>
        ))}
      </div>
    </MotionCard>
  )
}
