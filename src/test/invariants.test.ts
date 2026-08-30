import { describe, it, expect } from 'vitest'
import {
  calculateEqualSplit,
  calculatePercentageSplit,
  validateCustomSplit,
} from '@/domain/splits/splitCalculator'
import {
  deriveGroupBalances,
  simplifyDebts,
} from '@/domain/settlements/settlementEngine'
import { GroupMember } from '@/types/group'
import { GroupExpense } from '@/types/expense'
import { Settlement } from '@/types/settlement'

describe('Financial Invariants & Conservation Laws (P0 Hardening)', () => {
  describe('Paise Conservation Law: sum(shares) === totalPaise', () => {
    it('conserves exact paise across prime participant counts and arbitrary amounts', () => {
      const testCases = [
        { amount: 10000, count: 3 },
        { amount: 10001, count: 3 },
        { amount: 10002, count: 3 },
        { amount: 10000, count: 7 },
        { amount: 567891, count: 11 },
        { amount: 1, count: 5 },
        { amount: 7, count: 3 },
        { amount: 99999999, count: 13 },
      ]

      testCases.forEach(({ amount, count }) => {
        const participants = Array.from({ length: count }, (_, i) => `user_${i + 1}`)
        const shares = calculateEqualSplit(amount, participants)
        const sum = Object.values(shares).reduce((a, b) => a + b, 0)

        // Strict conservation invariant
        expect(sum).toBe(amount)

        // Integer minor unit invariant
        Object.values(shares).forEach((share) => {
          expect(Number.isInteger(share)).toBe(true)
          expect(share).toBeGreaterThanOrEqual(0)
        })

        // Maximum residue spread invariant (no member pays > 1 paise difference)
        const minShare = Math.min(...Object.values(shares))
        const maxShare = Math.max(...Object.values(shares))
        expect(maxShare - minShare).toBeLessThanOrEqual(1)
      })
    })

    it('percentage split conserves total paise for valid 100% weights', () => {
      const result = calculatePercentageSplit(10000, {
        u1: 33.33,
        u2: 33.33,
        u3: 33.34,
      })

      expect(result.isValid).toBe(true)
      const sum = Object.values(result.shares).reduce((a, b) => a + b, 0)
      expect(sum).toBe(10000)
      Object.values(result.shares).forEach((share) => {
        expect(Number.isInteger(share)).toBe(true)
      })
    })

    it('custom split enforces exact sum matching', () => {
      const valid = validateCustomSplit(50000, { u1: 20000, u2: 30000 })
      expect(valid.isValid).toBe(true)
      expect(valid.discrepancyPaise).toBe(0)

      const invalid = validateCustomSplit(50000, { u1: 20000, u2: 29999 })
      expect(invalid.isValid).toBe(false)
      expect(invalid.discrepancyPaise).toBe(1)
    })
  })

  describe('Zero-Sum Balance Invariant: sum(netBalancePaise) === 0', () => {
    it('maintains strict zero-sum invariant across random multi-expense & settlement cycles', () => {
      const members: GroupMember[] = [
        { userId: 'u1', displayName: 'Alice', email: null, role: 'owner', joinedAt: 1 },
        { userId: 'u2', displayName: 'Bob', email: null, role: 'member', joinedAt: 1 },
        { userId: 'u3', displayName: 'Charlie', email: null, role: 'member', joinedAt: 1 },
        { userId: 'u4', displayName: 'Diana', email: null, role: 'member', joinedAt: 1 },
        { userId: 'u5', displayName: 'Evan', email: null, role: 'member', joinedAt: 1 },
      ]

      const expenses: GroupExpense[] = [
        {
          id: 'exp1',
          groupId: 'g1',
          payerId: 'u1',
          payerSnapshot: { displayName: 'Alice' },
          amountPaise: 15000, // 150.00
          title: 'Groceries',
          category: 'Groceries',
          date: '2026-08-01',
          splitType: 'equal',
          participants: {
            u1: { userId: 'u1', displayNameSnapshot: 'Alice', amountPaise: 3000 },
            u2: { userId: 'u2', displayNameSnapshot: 'Bob', amountPaise: 3000 },
            u3: { userId: 'u3', displayNameSnapshot: 'Charlie', amountPaise: 3000 },
            u4: { userId: 'u4', displayNameSnapshot: 'Diana', amountPaise: 3000 },
            u5: { userId: 'u5', displayNameSnapshot: 'Evan', amountPaise: 3000 },
          },
          createdAt: 100,
          updatedAt: 100,
        },
        {
          id: 'exp2',
          groupId: 'g1',
          payerId: 'u2',
          payerSnapshot: { displayName: 'Bob' },
          amountPaise: 9999,
          title: 'Dinner',
          category: 'Food',
          date: '2026-08-02',
          splitType: 'equal',
          participants: {
            u1: { userId: 'u1', displayNameSnapshot: 'Alice', amountPaise: 3333 },
            u2: { userId: 'u2', displayNameSnapshot: 'Bob', amountPaise: 3333 },
            u3: { userId: 'u3', displayNameSnapshot: 'Charlie', amountPaise: 3333 },
          },
          createdAt: 200,
          updatedAt: 200,
        },
        {
          id: 'exp3',
          groupId: 'g1',
          payerId: 'u4',
          payerSnapshot: { displayName: 'Diana' },
          amountPaise: 25450,
          title: 'Cab',
          category: 'Travel',
          date: '2026-08-03',
          splitType: 'equal',
          participants: {
            u1: { userId: 'u1', displayNameSnapshot: 'Alice', amountPaise: 5090 },
            u2: { userId: 'u2', displayNameSnapshot: 'Bob', amountPaise: 5090 },
            u3: { userId: 'u3', displayNameSnapshot: 'Charlie', amountPaise: 5090 },
            u4: { userId: 'u4', displayNameSnapshot: 'Diana', amountPaise: 5090 },
            u5: { userId: 'u5', displayNameSnapshot: 'Evan', amountPaise: 5090 },
          },
          createdAt: 300,
          updatedAt: 300,
        },
      ]

      const settlements: Settlement[] = [
        {
          id: 'stl1',
          groupId: 'g1',
          payerId: 'u3',
          receiverId: 'u1',
          payerSnapshot: { displayName: 'Charlie' },
          receiverSnapshot: { displayName: 'Alice' },
          amountPaise: 5000,
          date: '2026-08-04',
          createdAt: 400,
        },
      ]

      const balances = deriveGroupBalances(members, expenses, settlements)
      const balanceList = Object.values(balances)

      // 1. Zero-Sum Invariant
      const netSum = balanceList.reduce((acc, b) => acc + b.netBalancePaise, 0)
      expect(netSum).toBe(0)

      // 2. All balances are valid integers
      balanceList.forEach((b) => {
        expect(Number.isInteger(b.netBalancePaise)).toBe(true)
        expect(Number.isInteger(b.totalPaidPaise)).toBe(true)
        expect(Number.isInteger(b.totalOwedPaise)).toBe(true)
      })

      // 3. Without settlements, netBalance strictly equals totalPaid - totalOwed
      const balancesNoSettlements = deriveGroupBalances(members, expenses, [])
      Object.values(balancesNoSettlements).forEach((b) => {
        expect(b.netBalancePaise).toBe(b.totalPaidPaise - b.totalOwedPaise)
      })
    })
  })

  describe('Greedy Debt Simplification Invariants', () => {
    it('simplifies circular debts and guarantees balance resolution', () => {
      // Alice is owed +6000, Bob is owed +2000, Charlie owes -5000, Diana owes -3000
      const balances = [
        { userId: 'u1', displayName: 'Alice', netBalancePaise: 6000, totalPaidPaise: 6000, totalOwedPaise: 0 },
        { userId: 'u2', displayName: 'Bob', netBalancePaise: 2000, totalPaidPaise: 2000, totalOwedPaise: 0 },
        { userId: 'u3', displayName: 'Charlie', netBalancePaise: -5000, totalPaidPaise: 0, totalOwedPaise: 5000 },
        { userId: 'u4', displayName: 'Diana', netBalancePaise: -3000, totalPaidPaise: 0, totalOwedPaise: 3000 },
      ]

      const proposed = simplifyDebts(balances)

      // Invariant 1: Total settled amount equals total positive balance
      const totalSettledPaise = proposed.reduce((acc, p) => acc + p.amountPaise, 0)
      expect(totalSettledPaise).toBe(8000)

      // Invariant 2: Transaction count <= (N - 1)
      expect(proposed.length).toBeLessThanOrEqual(balances.length - 1)

      // Invariant 3: Simulating proposed transactions brings all balances to exactly 0
      const finalBalances: Record<string, number> = {}
      balances.forEach((b) => {
        finalBalances[b.userId] = b.netBalancePaise
      })

      proposed.forEach((p) => {
        finalBalances[p.fromUserId] += p.amountPaise
        finalBalances[p.toUserId] -= p.amountPaise
      })

      Object.values(finalBalances).forEach((bal) => {
        expect(bal).toBe(0)
      })
    })
  })
})
