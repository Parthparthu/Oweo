import { describe, it, expect } from 'vitest'
import {
  aggregateByCategory,
  calculateMonthlyMetrics,
  generateSmartInsights,
} from '@/domain/analytics/analyticsEngine'
import { PersonalExpense } from '@/types/expense'

describe('Analytics & Smart Insights Engine', () => {
  const mockExpenses: PersonalExpense[] = [
    {
      id: '1',
      userId: 'u1',
      amountPaise: 400000, // ₹4,000
      category: 'Food',
      title: 'Monthly Food',
      date: '2026-08-10',
      createdAt: 0,
      updatedAt: 0,
    },
    {
      id: '2',
      userId: 'u1',
      amountPaise: 200000, // ₹2,000
      category: 'Travel',
      title: 'Metro Pass',
      date: '2026-08-12',
      createdAt: 0,
      updatedAt: 0,
    },
    {
      id: '3',
      userId: 'u1',
      amountPaise: 100000, // ₹1,000
      category: 'Entertainment',
      title: 'Movies',
      date: '2026-08-15',
      createdAt: 0,
      updatedAt: 0,
    },
  ]

  it('aggregates expenses by category with correct percentages', () => {
    const categories = aggregateByCategory(mockExpenses)
    // Grand total: ₹7,000 (700000 paise)
    expect(categories).toHaveLength(3)
    expect(categories[0].category).toBe('Food')
    expect(categories[0].totalPaise).toBe(400000)
    // 4000 / 7000 = 57.1%
    expect(categories[0].percentage).toBeCloseTo(57.1, 1)
  })

  it('calculates monthly spending metrics and budget progress', () => {
    const refDate = new Date('2026-08-20')
    const metrics = calculateMonthlyMetrics(mockExpenses, 1000000, refDate) // Budget ₹10,000

    expect(metrics.currentMonthTotalPaise).toBe(700000) // ₹7,000
    expect(metrics.budgetPaise).toBe(1000000)
    expect(metrics.budgetRemainingPaise).toBe(300000) // ₹3,000 remaining
    expect(metrics.budgetUsedPercentage).toBe(70) // 70% used
    expect(metrics.daysElapsed).toBe(20)
    expect(metrics.dailyAveragePaise).toBe(35000) // ₹350/day
  })

  it('generates non-judgmental, deterministic smart insights', () => {
    const refDate = new Date('2026-08-20')
    const metrics = calculateMonthlyMetrics(mockExpenses, 1000000, refDate)
    const insights = generateSmartInsights(mockExpenses, metrics)

    expect(insights.length).toBeGreaterThan(0)
    const topCatInsight = insights.find((i) => i.id === 'top-category')
    expect(topCatInsight).toBeDefined()
    expect(topCatInsight?.description).toContain('Food & Dining')
  })
})
