import { describe, it, expect } from 'vitest'
import { PersonalExpense, GroupExpense } from '@/types/expense'
import { Settlement } from '@/types/settlement'
import { calculateMonthlyMetrics } from '@/domain/analytics/analyticsEngine'

describe('Cash-Flow Out-of-Pocket Expense Calculation', () => {
  const groupExpenses: GroupExpense[] = [
    {
      id: 'ge_1',
      groupId: 'grp_1',
      payerId: 'user_A',
      payerSnapshot: { displayName: 'Person A' },
      amountPaise: 10000, // ₹100 Total Bill paid upfront by Person A
      title: 'Dinner',
      category: 'Food',
      date: '2026-08-23',
      splitType: 'equal',
      participants: {
        user_A: { userId: 'user_A', displayNameSnapshot: 'Person A', amountPaise: 5000 },
        user_B: { userId: 'user_B', displayNameSnapshot: 'Person B', amountPaise: 5000 },
      },
      createdAt: 1000,
      updatedAt: 1000,
    },
  ]

  it('Phase 1 (Before Settlement): Person A has ₹100 spend, Person B has ₹0 spend', () => {
    // Person A: paid ₹100 upfront
    const userA_Items: PersonalExpense[] = [
      {
        id: `gexp_${groupExpenses[0].id}`,
        userId: 'user_A',
        amountPaise: 10000, // ₹100 upfront
        category: 'Food',
        title: 'Dinner',
        date: '2026-08-23',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]

    const metricsA = calculateMonthlyMetrics(userA_Items, 0, new Date('2026-08-23'))
    expect(metricsA.currentMonthTotalPaise).toBe(10000) // ₹100

    // Person B: has not paid anything yet
    const userB_Items: PersonalExpense[] = []
    const metricsB = calculateMonthlyMetrics(userB_Items, 0, new Date('2026-08-23'))
    expect(metricsB.currentMonthTotalPaise).toBe(0) // ₹0
  })

  it('Phase 2 (After Settlement): Person B pays ₹50 settlement -> Person A becomes ₹50, Person B becomes ₹50', () => {
    const settlement: Settlement = {
      id: 'stl_1',
      groupId: 'grp_1',
      payerId: 'user_B',
      receiverId: 'user_A',
      payerSnapshot: { displayName: 'Person B' },
      receiverSnapshot: { displayName: 'Person A' },
      amountPaise: 5000, // ₹50
      date: '2026-08-23',
      createdAt: 2000,
    }

    // Person A: ₹100 upfront + (-₹50 reimbursement credit) = ₹50
    const userA_Items: PersonalExpense[] = [
      {
        id: `gexp_${groupExpenses[0].id}`,
        userId: 'user_A',
        amountPaise: 10000,
        category: 'Food',
        title: 'Dinner',
        date: '2026-08-23',
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: `stl_rec_${settlement.id}`,
        userId: 'user_A',
        amountPaise: -5000, // -₹50
        category: 'Settlement',
        title: 'Reimbursement from Person B',
        date: '2026-08-23',
        createdAt: 2000,
        updatedAt: 2000,
      },
    ]

    const metricsA = calculateMonthlyMetrics(userA_Items, 0, new Date('2026-08-23'))
    expect(metricsA.currentMonthTotalPaise).toBe(5000) // ₹50.00!

    // Person B: +₹50 settlement paid out-of-pocket
    const userB_Items: PersonalExpense[] = [
      {
        id: `stl_pay_${settlement.id}`,
        userId: 'user_B',
        amountPaise: 5000, // +₹50
        category: 'Settlement',
        title: 'Settled with Person A',
        date: '2026-08-23',
        createdAt: 2000,
        updatedAt: 2000,
      },
    ]

    const metricsB = calculateMonthlyMetrics(userB_Items, 0, new Date('2026-08-23'))
    expect(metricsB.currentMonthTotalPaise).toBe(5000) // ₹50.00!
  })
})
