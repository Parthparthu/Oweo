import { describe, it, expect } from 'vitest'
import {
  deriveGroupBalances,
  simplifyDebts,
} from '@/domain/settlements/settlementEngine'
import { GroupMember } from '@/types/group'
import { GroupExpense } from '@/types/expense'
import { Settlement, MemberBalance } from '@/types/settlement'

describe('Settlement & Debt Simplification Engine', () => {
  const mockMembers: GroupMember[] = [
    { userId: 'u1', displayName: 'Aman', email: 'aman@example.com', role: 'owner', joinedAt: 0 },
    { userId: 'u2', displayName: 'Rahul', email: 'rahul@example.com', role: 'member', joinedAt: 0 },
    { userId: 'u3', displayName: 'Karan', email: 'karan@example.com', role: 'member', joinedAt: 0 },
  ]

  it('derives correct member balances from shared group expenses', () => {
    // Aman pays ₹1,200 for Dinner split equally among Aman, Rahul, Karan (₹400 each)
    const expense: GroupExpense = {
      id: 'e1',
      groupId: 'g1',
      payerId: 'u1',
      payerSnapshot: { displayName: 'Aman' },
      amountPaise: 120000,
      title: 'Dinner',
      category: 'Food',
      date: '2026-08-23',
      splitType: 'equal',
      participants: {
        u1: { userId: 'u1', displayNameSnapshot: 'Aman', amountPaise: 40000 },
        u2: { userId: 'u2', displayNameSnapshot: 'Rahul', amountPaise: 40000 },
        u3: { userId: 'u3', displayNameSnapshot: 'Karan', amountPaise: 40000 },
      },
      createdAt: 0,
      updatedAt: 0,
    }

    const balances = deriveGroupBalances(mockMembers, [expense], [])

    // Aman paid 1200, owes 400 -> net +800
    expect(balances['u1'].netBalancePaise).toBe(80000)
    // Rahul paid 0, owes 400 -> net -400
    expect(balances['u2'].netBalancePaise).toBe(-40000)
    // Karan paid 0, owes 400 -> net -400
    expect(balances['u3'].netBalancePaise).toBe(-40000)
  })

  it('updates balances properly when manual settlements are recorded', () => {
    const expense: GroupExpense = {
      id: 'e1',
      groupId: 'g1',
      payerId: 'u1',
      payerSnapshot: { displayName: 'Aman' },
      amountPaise: 120000,
      title: 'Dinner',
      category: 'Food',
      date: '2026-08-23',
      splitType: 'equal',
      participants: {
        u1: { userId: 'u1', displayNameSnapshot: 'Aman', amountPaise: 40000 },
        u2: { userId: 'u2', displayNameSnapshot: 'Rahul', amountPaise: 40000 },
        u3: { userId: 'u3', displayNameSnapshot: 'Karan', amountPaise: 40000 },
      },
      createdAt: 0,
      updatedAt: 0,
    }

    // Rahul settles ₹400 with Aman
    const settlement: Settlement = {
      id: 's1',
      groupId: 'g1',
      payerId: 'u2', // Rahul paid
      receiverId: 'u1', // to Aman
      payerSnapshot: { displayName: 'Rahul' },
      receiverSnapshot: { displayName: 'Aman' },
      amountPaise: 40000,
      date: '2026-08-23',
      createdAt: 0,
    }

    const balances = deriveGroupBalances(mockMembers, [expense], [settlement])

    // Aman net balance is now +400 (was +800, received 400)
    expect(balances['u1'].netBalancePaise).toBe(40000)
    // Rahul net balance is now 0 (was -400, paid 400)
    expect(balances['u2'].netBalancePaise).toBe(0)
    // Karan net balance is still -400
    expect(balances['u3'].netBalancePaise).toBe(-40000)
  })

  it('simplifies circular 3-way debt correctly into minimal transactions', () => {
    // A owes B ₹300, B owes C ₹200, C owes A ₹100
    // Net: A = -200 (owes 200), B = +100 (gets 100), C = +100 (gets 100)
    const balances: MemberBalance[] = [
      { userId: 'u1', displayName: 'A', netBalancePaise: -20000, totalPaidPaise: 0, totalOwedPaise: 20000 },
      { userId: 'u2', displayName: 'B', netBalancePaise: 10000, totalPaidPaise: 10000, totalOwedPaise: 0 },
      { userId: 'u3', displayName: 'C', netBalancePaise: 10000, totalPaidPaise: 10000, totalOwedPaise: 0 },
    ]

    const proposed = simplifyDebts(balances)

    // Should produce exactly 2 proposed transactions
    expect(proposed).toHaveLength(2)

    // Total amount settled should equal 20000 paise (₹200)
    const totalSettled = proposed.reduce((acc, p) => acc + p.amountPaise, 0)
    expect(totalSettled).toBe(20000)

    // All payments should come from A (u1)
    expect(proposed.every((p) => p.fromUserId === 'u1')).toBe(true)
  })

  it('handles already settled groups with zero proposed settlements', () => {
    const balances: MemberBalance[] = [
      { userId: 'u1', displayName: 'A', netBalancePaise: 0, totalPaidPaise: 1000, totalOwedPaise: 1000 },
      { userId: 'u2', displayName: 'B', netBalancePaise: 0, totalPaidPaise: 1000, totalOwedPaise: 1000 },
    ]

    const proposed = simplifyDebts(balances)
    expect(proposed).toHaveLength(0)
  })

  it('simplifies complex 5-member debt matrix into minimal payments', () => {
    // 5 members:
    // u1 paid 5000 for all 5 (1000 each) -> u1 = +4000
    // u2 paid 3000 for u2, u3, u4 (1000 each) -> u2 paid 3000, owes 1000 (from u1's exp) + 1000 = 2000 -> u2 = +1000
    // u3 owes 1000 to u1 + 1000 to u2 = -2000
    // u4 owes 1000 to u1 + 1000 to u2 = -2000
    // u5 owes 1000 to u1 = -1000
    // Total creditors (+4000 + +1000 = +5000), total debtors (-2000 + -2000 + -1000 = -5000)
    const balances: MemberBalance[] = [
      { userId: 'u1', displayName: 'User 1', netBalancePaise: 400000, totalPaidPaise: 500000, totalOwedPaise: 100000 },
      { userId: 'u2', displayName: 'User 2', netBalancePaise: 100000, totalPaidPaise: 300000, totalOwedPaise: 200000 },
      { userId: 'u3', displayName: 'User 3', netBalancePaise: -200000, totalPaidPaise: 0, totalOwedPaise: 200000 },
      { userId: 'u4', displayName: 'User 4', netBalancePaise: -200000, totalPaidPaise: 0, totalOwedPaise: 200000 },
      { userId: 'u5', displayName: 'User 5', netBalancePaise: -100000, totalPaidPaise: 0, totalOwedPaise: 100000 },
    ]

    const proposed = simplifyDebts(balances)

    // Total settlements sum must be 500000 paise (₹5,000)
    const totalSettled = proposed.reduce((acc, p) => acc + p.amountPaise, 0)
    expect(totalSettled).toBe(500000)

    // No one should settle with themselves
    proposed.forEach((p) => {
      expect(p.fromUserId).not.toBe(p.toUserId)
      expect(p.amountPaise).toBeGreaterThan(0)
    })
  })
})
