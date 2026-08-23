import { describe, it, expect } from 'vitest'
import { deriveGroupBalances, simplifyDebts, deriveUserCrossGroupDebts } from '@/domain/settlements/settlementEngine'
import { GroupMember } from '@/types/group'
import { GroupExpense } from '@/types/expense'
import { Settlement } from '@/types/settlement'

describe('Group Split & Settlement Math Verification', () => {
  const members: GroupMember[] = [
    { userId: 'user_A', displayName: 'Aman', email: 'aman@example.com', role: 'owner', joinedAt: 1000 },
    { userId: 'user_B', displayName: 'Rohan', email: 'rohan@example.com', role: 'member', joinedAt: 1000 },
  ]

  it('correctly derives net balances: User A pays ₹500 (A owes ₹300, B owes ₹200)', () => {
    const expenses: GroupExpense[] = [
      {
        id: 'gexp_1',
        groupId: 'grp_1',
        payerId: 'user_A',
        payerSnapshot: { displayName: 'Aman' },
        amountPaise: 50000, // ₹500
        title: 'Dinner',
        category: 'Food',
        date: '2026-08-23',
        splitType: 'exact',
        participants: {
          user_A: { userId: 'user_A', displayNameSnapshot: 'Aman', amountPaise: 30000 },
          user_B: { userId: 'user_B', displayNameSnapshot: 'Rohan', amountPaise: 20000 },
        },
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]

    const balances = deriveGroupBalances(members, expenses, [])

    // User A paid 500, owes 300 -> net balance +200 (is owed 200)
    expect(balances['user_A'].totalPaidPaise).toBe(50000)
    expect(balances['user_A'].totalOwedPaise).toBe(30000)
    expect(balances['user_A'].netBalancePaise).toBe(20000)

    // User B paid 0, owes 200 -> net balance -200 (owes 200)
    expect(balances['user_B'].totalPaidPaise).toBe(0)
    expect(balances['user_B'].totalOwedPaise).toBe(20000)
    expect(balances['user_B'].netBalancePaise).toBe(-20000)

    // Proposed settlement: User B pays User A ₹200
    const proposed = simplifyDebts(Object.values(balances))
    expect(proposed).toHaveLength(1)
    expect(proposed[0]).toEqual({
      fromUserId: 'user_B',
      fromName: 'Rohan',
      fromPhoto: undefined,
      toUserId: 'user_A',
      toName: 'Aman',
      toPhoto: undefined,
      amountPaise: 20000,
    })
  })

  it('correctly updates balances to 0 after ₹200 settlement is recorded', () => {
    const expenses: GroupExpense[] = [
      {
        id: 'gexp_1',
        groupId: 'grp_1',
        payerId: 'user_A',
        payerSnapshot: { displayName: 'Aman' },
        amountPaise: 50000,
        title: 'Dinner',
        category: 'Food',
        date: '2026-08-23',
        splitType: 'exact',
        participants: {
          user_A: { userId: 'user_A', displayNameSnapshot: 'Aman', amountPaise: 30000 },
          user_B: { userId: 'user_B', displayNameSnapshot: 'Rohan', amountPaise: 20000 },
        },
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]

    const settlements: Settlement[] = [
      {
        id: 'stl_1',
        groupId: 'grp_1',
        payerId: 'user_B',
        receiverId: 'user_A',
        payerSnapshot: { displayName: 'Rohan' },
        receiverSnapshot: { displayName: 'Aman' },
        amountPaise: 20000, // ₹200
        date: '2026-08-23',
        createdAt: 2000,
      },
    ]

    const balances = deriveGroupBalances(members, expenses, settlements)

    // Both net balances are 0
    expect(balances['user_A'].netBalancePaise).toBe(0)
    expect(balances['user_B'].netBalancePaise).toBe(0)

    // No outstanding debts remain
    const proposed = simplifyDebts(Object.values(balances))
    expect(proposed).toHaveLength(0)
  })

  it('correctly derives cross-group debt summaries for the home page', () => {
    const groupBalances = {
      user_A: {
        userId: 'user_A',
        displayName: 'Aman',
        netBalancePaise: 20000, // +₹200
        totalPaidPaise: 50000,
        totalOwedPaise: 30000,
      },
      user_B: {
        userId: 'user_B',
        displayName: 'Rohan',
        netBalancePaise: -20000, // -₹200
        totalPaidPaise: 0,
        totalOwedPaise: 20000,
      },
    }

    const groupData = [
      {
        groupId: 'grp_1',
        groupName: 'Goa Trip',
        balances: groupBalances,
      },
    ]

    // From User A perspective
    const summaryA = deriveUserCrossGroupDebts('user_A', groupData)
    expect(summaryA.owedToUser).toHaveLength(1)
    expect(summaryA.owedToUser[0].amountPaise).toBe(20000)
    expect(summaryA.totalOwedToUserPaise).toBe(20000)
    expect(summaryA.totalUserOwesPaise).toBe(0)

    // From User B perspective
    const summaryB = deriveUserCrossGroupDebts('user_B', groupData)
    expect(summaryB.userOwes).toHaveLength(1)
    expect(summaryB.userOwes[0].amountPaise).toBe(20000)
    expect(summaryB.totalUserOwesPaise).toBe(20000)
    expect(summaryB.totalOwedToUserPaise).toBe(0)
  })
})
