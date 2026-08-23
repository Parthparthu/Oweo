import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'
import { CategorySpending } from '@/domain/analytics/analyticsEngine'
import { formatINR } from '@/domain/money/money'
import { Card } from '@/components/ui/Card'

interface Props {
  data: CategorySpending[]
}

export const SpendingBarChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) return null

  const chartData = data.slice(0, 6).map((d) => ({
    name: d.label,
    amount: d.totalPaise / 100,
    totalPaise: d.totalPaise,
    color: d.color,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-card/95 border border-border p-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs font-semibold">
          <p className="text-foreground font-bold">{item.name}</p>
          <p className="text-primary font-black mt-0.5">{formatINR(item.totalPaise)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="p-5 border-border/70 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-foreground">Top Spending Areas</h3>
        <span className="text-xs text-muted-foreground font-medium">Ranked by volume</span>
      </div>

      <div className="h-52 xs:h-56 sm:h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={35}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible data list fallback */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-semibold text-foreground truncate">{item.name}:</span>
            <span className="text-muted-foreground font-bold shrink-0 tabular-nums">
              {formatINR(item.totalPaise)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
