import { describe, it, expect } from 'vitest'
import {
  calculateCategoryBudgetMetrics,
  calculateMonthlyMetrics,
  generateSmartInsights,
} from '@/domain/analytics/analyticsEngine'
import { PersonalExpense } from '@/types/expense'

describe('Category Budgets & Advanced Analytics', () => {
  const sampleExpenses: PersonalExpense[] = [
    {
      id: 'e1',
      userId: 'u1',
      amountPaise: 400000, // ₹4000
      category: 'Food',
      title: 'Groceries & Dining',
      date: '2026-08-05',
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'e2',
      userId: 'u1',
      amountPaise: 180000, // ₹1800
      category: 'Travel',
      title: 'Cab rides',
      date: '2026-08-10',
      createdAt: 2000,
      updatedAt: 2000,
    },
    {
      id: 'e3',
      userId: 'u1',
      amountPaise: 150000, // ₹1500
      category: 'Shopping',
      title: 'Clothes',
      date: '2026-08-15',
      createdAt: 3000,
      updatedAt: 3000,
    },
  ]

  it('calculates category budget metrics accurately with alert levels', () => {
    const categoryBudgetsPaise = {
      Food: 500000, // ₹5000 (80% used -> warning)
      Travel: 200000, // ₹2000 (90% used -> critical)
      Shopping: 100000, // ₹1000 (150% used -> exceeded)
      Rent: 1500000, // ₹15000 (0% used -> normal)
    }

    const metrics = calculateCategoryBudgetMetrics(sampleExpenses, categoryBudgetsPaise)

    expect(metrics).toHaveLength(4)

    const food = metrics.find((m) => m.category === 'Food')!
    expect(food.spentPaise).toBe(400000)
    expect(food.usedPercentage).toBe(80)
    expect(food.alertLevel).toBe('warning')
    expect(food.remainingPaise).toBe(100000)

    const travel = metrics.find((m) => m.category === 'Travel')!
    expect(travel.spentPaise).toBe(180000)
    expect(travel.usedPercentage).toBe(90)
    expect(travel.alertLevel).toBe('critical')
    expect(travel.remainingPaise).toBe(20000)

    const shopping = metrics.find((m) => m.category === 'Shopping')!
    expect(shopping.spentPaise).toBe(150000)
    expect(shopping.usedPercentage).toBe(150)
    expect(shopping.alertLevel).toBe('exceeded')
    expect(shopping.remainingPaise).toBe(0)

    const rent = metrics.find((m) => m.category === 'Rent')!
    expect(rent.spentPaise).toBe(0)
    expect(rent.usedPercentage).toBe(0)
    expect(rent.alertLevel).toBe('normal')
  })

  it('generates non-annoying budget alert insights for critical and exceeded categories', () => {
    const categoryBudgetsPaise = {
      Food: 500000,
      Travel: 200000,
    }

    const metrics = calculateMonthlyMetrics(
      sampleExpenses,
      1000000,
      categoryBudgetsPaise,
      new Date('2026-08-20')
    )

    const insights = generateSmartInsights(sampleExpenses, metrics, new Date('2026-08-20'))

    // Should have insights for Food and Travel
    const foodInsight = insights.find((i) => i.id === 'cat-budget-warning-Food')
    expect(foodInsight).toBeDefined()
    expect(foodInsight?.type).toBe('info')

    const travelInsight = insights.find((i) => i.id === 'cat-budget-critical-Travel')
    expect(travelInsight).toBeDefined()
    expect(travelInsight?.type).toBe('warning')
  })

  it('correctly calculates end-of-month velocity forecasting', () => {
    // 20 days elapsed, spent ₹7300 -> daily average = ₹365/day -> projected 31 days = ₹11,315
    const metrics = calculateMonthlyMetrics(
      sampleExpenses,
      800000, // ₹8000 monthly budget
      {},
      new Date('2026-08-20')
    )

    expect(metrics.currentMonthTotalPaise).toBe(730000)
    expect(metrics.dailyAveragePaise).toBe(36500)
    expect(metrics.projectedMonthEndPaise).toBe(36500 * 31)
    // Budget exhaustion date should be projected since ₹8000 < ₹11,315
    expect(metrics.projectedOverrunDate).toBeDefined()
  })
})
