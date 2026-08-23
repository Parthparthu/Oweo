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
})
