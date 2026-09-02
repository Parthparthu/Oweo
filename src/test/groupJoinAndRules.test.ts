import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchGroupInvite,
  redeemGroupInvite,
  leaveGroup,
} from '@/services/firebase/groupService'
import { deleteUserAccount } from '@/services/firebase/authService'
import { resetCurrentUserData } from '@/services/firebase/resetService'

// Mock Firebase config
vi.mock('@/services/firebase/config', () => ({
  db: { _isMock: true },
  auth: {
    currentUser: {
      uid: 'test_user_1',
      displayName: 'Test User',
      email: 'test@example.com',
    },
  },
  googleAuthProvider: {},
  isFirebaseConfigured: () => true,
}))

// Mock audit log service
vi.mock('@/services/firebase/auditLogService', () => ({
  recordAuditLog: vi.fn().mockResolvedValue({ id: 'audit_123' }),
  subscribeGroupAuditLogs: vi.fn(),
  fetchGroupAuditLogsPage: vi.fn(),
}))

const mockBatchSet = vi.fn()
const mockBatchUpdate = vi.fn()
const mockBatchDelete = vi.fn()
const mockBatchCommit = vi.fn().mockResolvedValue(undefined)
const mockWriteBatch = vi.fn(() => ({
  set: mockBatchSet,
  update: mockBatchUpdate,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}))

let mockGetDocData: Record<string, any> = {}
let mockGetDocExists: Record<string, boolean> = {}
let mockQueryResults: Record<string, any[]> = {}
const mockDeleteUser = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  deleteUser: (...args: any[]) => mockDeleteUser(...args),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...pathSegments) => ({ path: pathSegments.join('/') })),
  collection: vi.fn((_db, ...pathSegments) => ({ path: pathSegments.join('/') })),
  query: vi.fn((colRef, ...conditions) => ({ colRef, conditions })),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  limit: vi.fn((n) => ({ limit: n })),
  startAfter: vi.fn((doc) => ({ startAfter: doc })),
  arrayUnion: vi.fn((val) => ({ _arrayUnion: val })),
  arrayRemove: vi.fn((val) => ({ _arrayRemove: val })),
  increment: vi.fn((n) => ({ _increment: n })),
  getDoc: vi.fn(async (docRef) => {
    const p = docRef.path || ''
    const exists = mockGetDocExists[p] ?? true
    const data = mockGetDocData[p] || {}
    return {
      exists: () => exists,
      data: () => data,
      id: p.split('/').pop() || '',
    }
  }),
  getDocs: vi.fn(async (q) => {
    const colPath = q.colRef?.path || q.path || ''
    const rawDocs = mockQueryResults[colPath] || []
    const mapped = rawDocs.map((d, i) => ({
      id: d.id || `doc_${i}`,
      ref: { path: `${colPath}/${d.id || `doc_${i}`}` },
      data: () => d,
    }))
    return {
      docs: mapped,
      forEach: (cb: any) => mapped.forEach(cb),
    }
  }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  writeBatch: () => mockWriteBatch(),
  onSnapshot: vi.fn(() => () => {}),
}))

describe('Group Join, Invites & Firestore Permissions Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDocData = {}
    mockGetDocExists = {}
    mockQueryResults = {}
  })

  describe('fetchGroupInvite (Invite Preview)', () => {
    it('fetches valid invite details for join preview', async () => {
      mockGetDocExists['invites/INV-VALID'] = true
      mockGetDocData['invites/INV-VALID'] = {
        inviteCode: 'INV-VALID',
        groupId: 'grp_100',
        groupName: 'Roommates 2026',
        createdBy: 'user_owner',
        creatorName: 'Aman',
        expiresAt: Date.now() + 86400000,
        usedCount: 1,
        isRevoked: false,
      }

      const res = await fetchGroupInvite('INV-VALID')
      expect(res.invite.groupName).toBe('Roommates 2026')
      expect(res.invite.creatorName).toBe('Aman')
      expect(res.isExpired).toBe(false)
      expect(res.isRevoked).toBe(false)
    })

    it('detects expired invite links', async () => {
      mockGetDocExists['invites/INV-EXP'] = true
      mockGetDocData['invites/INV-EXP'] = {
        inviteCode: 'INV-EXP',
        groupId: 'grp_100',
        groupName: 'Old Trip',
        createdBy: 'user_owner',
        creatorName: 'Aman',
        expiresAt: Date.now() - 1000, // Expired
        usedCount: 0,
        isRevoked: false,
      }

      const res = await fetchGroupInvite('INV-EXP')
      expect(res.isExpired).toBe(true)
    })

    it('detects revoked invite links', async () => {
      mockGetDocExists['invites/INV-REV'] = true
      mockGetDocData['invites/INV-REV'] = {
        inviteCode: 'INV-REV',
        groupId: 'grp_100',
        groupName: 'Secret Group',
        createdBy: 'user_owner',
        creatorName: 'Aman',
        expiresAt: Date.now() + 86400000,
        usedCount: 0,
        isRevoked: true,
      }

      const res = await fetchGroupInvite('INV-REV')
      expect(res.isRevoked).toBe(true)
    })

    it('throws error for non-existent invite code', async () => {
      mockGetDocExists['invites/INV-NONEXISTENT'] = false
      await expect(fetchGroupInvite('INV-NONEXISTENT')).rejects.toThrow('Invalid invite link or code.')
    })
  })

  describe('redeemGroupInvite (Atomic Join Operation)', () => {
    it('returns success immediately if user is already a group member', async () => {
      mockGetDocExists['invites/INV-CODE'] = true
      mockGetDocData['invites/INV-CODE'] = {
        inviteCode: 'INV-CODE',
        groupId: 'grp_100',
        groupName: 'Goa Trip',
        expiresAt: Date.now() + 86400000,
        isRevoked: false,
        usedCount: 0,
      }

      mockGetDocExists['groups/grp_100'] = true
      mockGetDocData['groups/grp_100'] = {
        id: 'grp_100',
        name: 'Goa Trip',
        memberIds: ['user_existing', 'user_joining'],
      }

      const res = await redeemGroupInvite('INV-CODE', {
        uid: 'user_joining',
        displayName: 'Friend',
        email: 'friend@example.com',
      })

      expect(res.success).toBe(true)
      expect(res.message).toBe('You are already a member of this group!')
      expect(mockBatchCommit).not.toHaveBeenCalled()
    })

    it('atomically adds new member, updates group memberIds, and increments usedCount in a single batch', async () => {
      mockGetDocExists['invites/INV-JOIN'] = true
      mockGetDocData['invites/INV-JOIN'] = {
        inviteCode: 'INV-JOIN',
        groupId: 'grp_200',
        groupName: 'Flat 402',
        expiresAt: Date.now() + 86400000,
        isRevoked: false,
        usedCount: 2,
      }

      mockGetDocExists['groups/grp_200'] = true
      mockGetDocData['groups/grp_200'] = {
        id: 'grp_200',
        name: 'Flat 402',
        memberIds: ['user_owner'],
      }

      const res = await redeemGroupInvite('INV-JOIN', {
        uid: 'user_new_friend',
        displayName: 'Priya',
        email: 'priya@example.com',
      })

      expect(res.success).toBe(true)
      expect(res.groupName).toBe('Flat 402')
      expect(res.groupId).toBe('grp_200')

      // Verifies batch set for member record
      expect(mockBatchSet).toHaveBeenCalledWith(
        { path: 'groups/grp_200/members/user_new_friend' },
        expect.objectContaining({
          userId: 'user_new_friend',
          displayName: 'Priya',
          role: 'member',
        })
      )

      // Verifies batch update for group memberIds
      expect(mockBatchUpdate).toHaveBeenCalledWith(
        { path: 'groups/grp_200' },
        expect.objectContaining({
          memberIds: { _arrayUnion: 'user_new_friend' },
        })
      )

      // Verifies batch update for invite usedCount
      expect(mockBatchUpdate).toHaveBeenCalledWith(
        { path: 'invites/INV-JOIN' },
        expect.objectContaining({
          usedCount: 3,
        })
      )

      // Verifies atomic commit was executed
      expect(mockBatchCommit).toHaveBeenCalledTimes(1)
    })

    it('rejects expired invites', async () => {
      mockGetDocExists['invites/INV-EXPIRED'] = true
      mockGetDocData['invites/INV-EXPIRED'] = {
        inviteCode: 'INV-EXPIRED',
        groupId: 'grp_300',
        expiresAt: Date.now() - 5000,
        isRevoked: false,
      }

      await expect(
        redeemGroupInvite('INV-EXPIRED', {
          uid: 'user_test',
          displayName: 'Test',
          email: null,
        })
      ).rejects.toThrow('This invitation link has expired.')
    })

    it('rejects revoked invites', async () => {
      mockGetDocExists['invites/INV-REVOKED'] = true
      mockGetDocData['invites/INV-REVOKED'] = {
        inviteCode: 'INV-REVOKED',
        groupId: 'grp_300',
        expiresAt: Date.now() + 100000,
        isRevoked: true,
      }

      await expect(
        redeemGroupInvite('INV-REVOKED', {
          uid: 'user_test',
          displayName: 'Test',
          email: null,
        })
      ).rejects.toThrow('This invitation link has been revoked.')
    })
  })

  describe('leaveGroup (Atomic Leave Operation)', () => {
    it('atomically removes user from group memberIds and deletes member document', async () => {
      await leaveGroup('grp_100', 'user_leaving')

      expect(mockBatchUpdate).toHaveBeenCalledWith(
        { path: 'groups/grp_100' },
        expect.objectContaining({
          memberIds: { _arrayRemove: 'user_leaving' },
        })
      )

      expect(mockBatchDelete).toHaveBeenCalledWith({
        path: 'groups/grp_100/members/user_leaving',
      })

      expect(mockBatchCommit).toHaveBeenCalledTimes(1)
    })
  })

  describe('Data Cleanup & Account Deletion Integrity', () => {
    it('deleteUserAccount deletes expenses, directDebts, recurringExpenses, invites, and user document', async () => {
      mockQueryResults['expenses'] = [{ id: 'exp_1' }, { id: 'exp_2' }]
      mockQueryResults['directDebts'] = [{ id: 'debt_1' }]
      mockQueryResults['recurringExpenses'] = [{ id: 'rec_1' }]
      mockQueryResults['invites'] = [{ id: 'INV-1' }]

      await deleteUserAccount()

      // Should delete 2 expenses + 1 debt + 1 recurring + 1 invite + 1 user = 6 batch deletes
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'expenses/exp_1' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'expenses/exp_2' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'directDebts/debt_1' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'recurringExpenses/rec_1' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'invites/INV-1' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'users/test_user_1' })
      expect(mockBatchCommit).toHaveBeenCalledTimes(1)
      expect(mockDeleteUser).toHaveBeenCalledTimes(1)
    })

    it('resetCurrentUserData deletes all user test data including 1:1 debts and subscriptions', async () => {
      mockQueryResults['expenses'] = [{ id: 'exp_1' }]
      mockQueryResults['directDebts'] = [{ id: 'debt_1' }]
      mockQueryResults['recurringExpenses'] = [{ id: 'rec_1' }]
      mockQueryResults['groups'] = [{ id: 'grp_1' }]
      mockQueryResults['invites'] = [{ id: 'INV-1' }]

      await resetCurrentUserData('user_reset')

      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'expenses/exp_1' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'directDebts/debt_1' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'recurringExpenses/rec_1' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'groups/grp_1' })
      expect(mockBatchDelete).toHaveBeenCalledWith({ path: 'invites/INV-1' })
      expect(mockBatchUpdate).toHaveBeenCalledWith(
        { path: 'users/user_reset' },
        expect.objectContaining({ walletBalancePaise: 0 })
      )
      expect(mockBatchCommit).toHaveBeenCalledTimes(1)
    })
  })
})
