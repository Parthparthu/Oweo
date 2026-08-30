import { describe, it, expect } from 'vitest'
import { detectRecurringExpenses } from '@/domain/expenses/recurringDetector'
import { PersonalExpense } from '@/types/expense'
import { RecurringExpense } from '@/types/recurring'

describe('Recurring Pattern Detector', () => {
  const expenses: PersonalExpense[] = [
    // Netflix recurring on 5th of each month (₹649)
    {
      id: 'e1',
      userId: 'u1',
      title: 'Netflix Subscription',
      amountPaise: 64900,
      category: 'Subscriptions',
      date: '2026-06-05',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'e2',
      userId: 'u1',
      title: 'Netflix Subscription',
      amountPaise: 64900,
      category: 'Subscriptions',
      date: '2026-07-05',
      createdAt: 2,
      updatedAt: 2,
    },
    {
      id: 'e3',
      userId: 'u1',
      title: 'Netflix Subscription',
      amountPaise: 64900,
      category: 'Subscriptions',
      date: '2026-08-05',
      createdAt: 3,
      updatedAt: 3,
    },
    // House Rent on 1st of each month (₹15,000)
    {
      id: 'e4',
      userId: 'u1',
      title: 'House Rent',
      amountPaise: 1500000,
      category: 'Rent',
      date: '2026-07-01',
      createdAt: 4,
      updatedAt: 4,
    },
    {
      id: 'e5',
      userId: 'u1',
      title: 'House Rent',
      amountPaise: 1500000,
      category: 'Rent',
      date: '2026-08-01',
      createdAt: 5,
      updatedAt: 5,
    },
    // Random one-off expense
    {
      id: 'e6',
      userId: 'u1',
      title: 'Dinner at cafe',
      amountPaise: 85000,
      category: 'Food',
      date: '2026-08-12',
      createdAt: 6,
      updatedAt: 6,
    },
  ]

  it('detects periodic recurring patterns from historical transactions', () => {
    const detected = detectRecurringExpenses(expenses)

    expect(detected.length).toBe(2)

    const netflix = detected.find((d) => d.title.toLowerCase().includes('netflix'))
    expect(netflix).toBeDefined()
    expect(netflix?.amountPaise).toBe(64900)
    expect(netflix?.suggestedBillingDay).toBe(5)
    expect(netflix?.occurrences).toBe(3)
    expect(netflix?.confidence).toBeGreaterThan(0.7)

    const rent = detected.find((d) => d.title.toLowerCase().includes('rent'))
    expect(rent).toBeDefined()
    expect(rent?.amountPaise).toBe(1500000)
    expect(rent?.suggestedBillingDay).toBe(1)
    expect(rent?.occurrences).toBe(2)
  })

  it('filters out patterns that are already being tracked in existingRecurring', () => {
    const existingRecurring: RecurringExpense[] = [
      {
        id: 'rec_1',
        userId: 'u1',
        title: 'Netflix Subscription',
        amountPaise: 64900,
        category: 'Subscriptions',
        frequency: 'monthly',
        billingDay: 5,
        nextDueDate: '2026-09-05',
        isActive: true,
        createdAt: 1,
        updatedAt: 1,
      },
    ]

    const detected = detectRecurringExpenses(expenses, existingRecurring)

    // Netflix should now be filtered out
    expect(detected.length).toBe(1)
    expect(detected[0].title).toBe('House Rent')
  })
})
