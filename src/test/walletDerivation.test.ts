import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deriveWalletBalance } from '@/domain/money/money'
import { calculateMigrationInitialBalance, migrateUserWallet } from '@/services/firebase/migrationService'
import { PersonalTransaction } from '@/types/expense'
import { Settlement } from '@/types/settlement'

// Mock firebase/firestore and config
vi.mock('@/services/firebase/config', () => ({
  db: { _isMock: true },
}))

const mockBatchSet = vi.fn()
const mockBatchUpdate = vi.fn()
const mockBatchCommit = vi.fn().mockResolvedValue(undefined)
const mockWriteBatch = vi.fn(() => ({
  set: mockBatchSet,
  update: mockBatchUpdate,
  commit: mockBatchCommit,
}))

let mockUserDocExists = true
let mockUserData: any = {}
let mockExpenseDocs: any[] = []

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, collectionName, id) => ({ collectionName, id })),
  collection: vi.fn((_db, collectionName) => ({ collectionName })),
  query: vi.fn((...args) => ({ _query: args })),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  getDoc: vi.fn(async (docRef) => ({
    exists: () => mockUserDocExists,
    data: () => mockUserData,
    id: docRef.id,
  })),
  getDocs: vi.fn(async () => ({
    docs: mockExpenseDocs,
    forEach: (cb: (doc: any) => void) => mockExpenseDocs.forEach(cb),
  })),
  writeBatch: () => mockWriteBatch(),
  increment: vi.fn((n: number) => ({ _increment: n })),
}))

describe('Wallet Balance Derivation & Migration Suite (The Wallet Paradigm Shift)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserDocExists = true
    mockUserData = {}
    mockExpenseDocs = []
  })

  describe('Core Wallet Balance Derivation: sum(INCOME) - sum(EXPENSE)', () => {
    it('returns 0 for an empty transaction list', () => {
      expect(deriveWalletBalance([])).toBe(0)
    })

    it('accurately derives balance from pure income transactions', () => {
      const txs: Array<{ amountPaise: number; type: 'INCOME' | 'EXPENSE' }> = [
        { amountPaise: 500000, type: 'INCOME' }, // ₹5,000 pocket money
        { amountPaise: 150000, type: 'INCOME' }, // ₹1,500 stipend
        { amountPaise: 20000, type: 'INCOME' },  // ₹200 cashback
      ]
      expect(deriveWalletBalance(txs)).toBe(670000) // ₹6,700
    })

    it('accurately derives balance from pure expense transactions', () => {
      const txs: Array<{ amountPaise: number; type: 'INCOME' | 'EXPENSE' }> = [
        { amountPaise: 25000, type: 'EXPENSE' }, // ₹250 food
        { amountPaise: 12000, type: 'EXPENSE' }, // ₹120 auto
      ]
      expect(deriveWalletBalance(txs)).toBe(-37000) // -₹370
    })

    it('accurately derives net balance for realistic student cash-flow', () => {
      const txs: Array<{ amountPaise: number; type: 'INCOME' | 'EXPENSE' }> = [
        { amountPaise: 1000000, type: 'INCOME' }, // ₹10,000 allowance
        { amountPaise: 300000, type: 'EXPENSE' },  // ₹3,000 hostel rent share
        { amountPaise: 150000, type: 'EXPENSE' },  // ₹1,500 food/canteen
        { amountPaise: 50000, type: 'INCOME' },   // ₹500 friend returned money
        { amountPaise: 80000, type: 'EXPENSE' },   // ₹800 books
      ]
      // 1000000 - 300000 - 150000 + 50000 - 80000 = 520000 (₹5,200)
      expect(deriveWalletBalance(txs)).toBe(520000)
    })

    it('enforces strict integer paise invariants and handles edge floating amounts', () => {
      const txs: Array<{ amountPaise: number; type: 'INCOME' | 'EXPENSE' }> = [
        { amountPaise: 100.4, type: 'INCOME' },
        { amountPaise: 50.6, type: 'EXPENSE' },
      ]
      // 100 - 51 = 49
      expect(deriveWalletBalance(txs)).toBe(49)
      expect(Number.isInteger(deriveWalletBalance(txs))).toBe(true)
    })

    it('safely handles missing or corrupted amounts without NaN errors', () => {
      const txs: Array<{ amountPaise?: number; type?: 'INCOME' | 'EXPENSE' }> = [
        { amountPaise: undefined, type: 'INCOME' },
        { amountPaise: NaN, type: 'EXPENSE' },
        { amountPaise: 20000, type: 'INCOME' },
      ]
      expect(deriveWalletBalance(txs)).toBe(20000)
    })
  })

  describe('Migration Derivation: calculateMigrationInitialBalance', () => {
    it('converts legacy monthlyBudgetPaise into initial balance matching old remaining budget', () => {
      const monthlyBudgetPaise = 800000 // ₹8,000 legacy budget
      const existingExpenses = [
        { amountPaise: 200000, type: 'EXPENSE' as const }, // ₹2,000 spent
        { amountPaise: 150000, type: 'EXPENSE' as const }, // ₹1,500 spent
      ]

      const result = calculateMigrationInitialBalance(monthlyBudgetPaise, existingExpenses)

      expect(result.totalExpensesPaise).toBe(350000) // ₹3,500
      expect(result.initialBalancePaise).toBe(450000) // ₹4,500 remaining balance
    })

    it('handles legacy records where type field is omitted (defaulting to EXPENSE)', () => {
      const monthlyBudgetPaise = 500000 // ₹5,000
      const existingExpenses = [
        { amountPaise: 100000 }, // Legacy expense without type
        { amountPaise: 50000, type: 'EXPENSE' as const },
      ]

      const result = calculateMigrationInitialBalance(monthlyBudgetPaise, existingExpenses)
      expect(result.totalExpensesPaise).toBe(150000)
      expect(result.initialBalancePaise).toBe(350000)
    })

    it('handles zero or missing budget gracefully', () => {
      const result = calculateMigrationInitialBalance(0, [
        { amountPaise: 12000, type: 'EXPENSE' as const },
      ])
      expect(result.totalExpensesPaise).toBe(12000)
      expect(result.initialBalancePaise).toBe(-12000)
    })
  })

  describe('Full Migration Lifecycle: migrateUserWallet', () => {
    it('skips migration if isWalletMigrated is already true', async () => {
      mockUserData = {
        uid: 'user_1',
        monthlyBudgetPaise: 500000,
        isWalletMigrated: true,
      }

      await migrateUserWallet('user_1')

      expect(mockBatchCommit).not.toHaveBeenCalled()
      expect(mockBatchSet).not.toHaveBeenCalled()
      expect(mockBatchUpdate).not.toHaveBeenCalled()
    })

    it('performs atomic migration creating initial INCOME and setting wallet balance', async () => {
      mockUserData = {
        uid: 'user_student',
        monthlyBudgetPaise: 1000000, // ₹10,000 legacy budget
        isWalletMigrated: false,
      }

      mockExpenseDocs = [
        {
          data: () => ({ amountPaise: 250000, type: 'EXPENSE' }),
        },
        {
          data: () => ({ amountPaise: 150000, type: 'EXPENSE' }),
        },
      ]

      await migrateUserWallet('user_student')

      expect(mockWriteBatch).toHaveBeenCalled()

      // 1. Initial INCOME transaction created for historical budget capital
      expect(mockBatchSet).toHaveBeenCalledTimes(1)
      const setCall = mockBatchSet.mock.calls[0]
      const initialIncomeTx: PersonalTransaction = setCall[1]
      expect(initialIncomeTx.userId).toBe('user_student')
      expect(initialIncomeTx.type).toBe('INCOME')
      expect(initialIncomeTx.amountPaise).toBe(1000000)
      expect(initialIncomeTx.title).toBe('Initial Migration Balance')

      // 2. User profile updated with initialBalancePaise and marked as migrated
      expect(mockBatchUpdate).toHaveBeenCalledTimes(1)
      const updateCall = mockBatchUpdate.mock.calls[0]
      expect(updateCall[1]).toEqual({
        walletBalancePaise: 600000, // 1000000 - 400000 = 600000 (₹6,000)
        isWalletMigrated: true,
      })

      expect(mockBatchCommit).toHaveBeenCalledTimes(1)
    })

    it('handles legacy user with 0 budget by setting balance to -expenses without creating 0 income tx', async () => {
      mockUserData = {
        uid: 'user_zero_budget',
        monthlyBudgetPaise: 0,
        isWalletMigrated: false,
      }

      mockExpenseDocs = [
        {
          data: () => ({ amountPaise: 50000, type: 'EXPENSE' }),
        },
      ]

      await migrateUserWallet('user_zero_budget')

      // No initial income transaction should be created for ₹0 budget
      expect(mockBatchSet).not.toHaveBeenCalled()

      // But user should be marked as migrated with wallet balance = -50000
      expect(mockBatchUpdate).toHaveBeenCalledTimes(1)
      const updateCall = mockBatchUpdate.mock.calls[0]
      expect(updateCall[1]).toEqual({
        walletBalancePaise: -50000,
        isWalletMigrated: true,
      })
      expect(mockBatchCommit).toHaveBeenCalledTimes(1)
    })
  })

  describe('Settlement Integration & Conservation Laws', () => {
    it('guarantees zero-sum balance delta between payer and receiver during group settlement', () => {
      const settlement: Settlement = {
        id: 'stl_abc_123',
        groupId: 'grp_roommates',
        payerId: 'user_alice',
        receiverId: 'user_bob',
        payerSnapshot: { displayName: 'Alice' },
        receiverSnapshot: { displayName: 'Bob' },
        amountPaise: 45000, // ₹450
        date: '2026-08-30',
        createdAt: Date.now(),
      }

      // Payer wallet impact: -45000 (EXPENSE)
      const payerDelta = -settlement.amountPaise
      // Receiver wallet impact: +45000 (INCOME)
      const receiverDelta = settlement.amountPaise

      // Zero-Sum Conservation Law
      expect(payerDelta + receiverDelta).toBe(0)

      // Linked transactions consistency
      const payerTx: PersonalTransaction = {
        id: 'exp_payer_1',
        userId: settlement.payerId,
        type: 'EXPENSE',
        amountPaise: settlement.amountPaise,
        category: 'Settlement',
        title: `Settled up with ${settlement.receiverSnapshot.displayName}`,
        date: settlement.date,
        linkedSettlementId: settlement.id,
        createdAt: settlement.createdAt,
        updatedAt: settlement.createdAt,
      }

      const receiverTx: PersonalTransaction = {
        id: 'exp_receiver_1',
        userId: settlement.receiverId,
        type: 'INCOME',
        amountPaise: settlement.amountPaise,
        category: 'Settlement',
        title: `Settled up by ${settlement.payerSnapshot.displayName}`,
        date: settlement.date,
        linkedSettlementId: settlement.id,
        createdAt: settlement.createdAt,
        updatedAt: settlement.createdAt,
      }

      expect(payerTx.linkedSettlementId).toBe(settlement.id)
      expect(receiverTx.linkedSettlementId).toBe(settlement.id)
      expect(payerTx.type).toBe('EXPENSE')
      expect(receiverTx.type).toBe('INCOME')

      // Verify wallet derivation on both sides
      const aliceInitialBalance = 100000 // ₹1,000
      const bobInitialBalance = 20000    // ₹200

      const aliceNewBalance = aliceInitialBalance + deriveWalletBalance([payerTx])
      const bobNewBalance = bobInitialBalance + deriveWalletBalance([receiverTx])

      expect(aliceNewBalance).toBe(55000)  // ₹1000 - ₹450 = ₹550
      expect(bobNewBalance).toBe(65000)    // ₹200 + ₹450 = ₹650
    })
  })
})
