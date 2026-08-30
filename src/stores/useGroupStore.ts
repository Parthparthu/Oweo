import { create } from 'zustand'
import { Group, GroupMember } from '@/types/group'
import { GroupExpense } from '@/types/expense'
import { Settlement, MemberBalance, ProposedSettlement } from '@/types/settlement'
import { GroupAuditLog } from '@/types/auditLog'
import {
  subscribeUserGroups,
  subscribeGroup,
  subscribeGroupMembers,
  subscribeGroupExpenses,
  subscribeGroupSettlements,
  createGroup,
  addGroupExpense,
  updateGroupExpense,
  deleteGroupExpense,
  recordGroupSettlement,
  leaveGroup,
} from '@/services/firebase/groupService'
import { subscribeGroupAuditLogs } from '@/services/firebase/auditLogService'
import { deriveGroupBalances, simplifyDebts } from '@/domain/settlements/settlementEngine'

interface GroupDataCache {
  members: GroupMember[]
  expenses: GroupExpense[]
  settlements: Settlement[]
  balances: Record<string, MemberBalance>
  auditLogs: GroupAuditLog[]
}

interface GroupState {
  groups: Group[]
  isLoadingGroups: boolean
  activeGroupId: string | null
  activeGroup: Group | null
  activeGroupMembers: GroupMember[]
  activeGroupExpenses: GroupExpense[]
  activeGroupSettlements: Settlement[]
  activeGroupBalances: Record<string, MemberBalance>
  activeGroupProposedSettlements: ProposedSettlement[]
  activeGroupAuditLogs: GroupAuditLog[]

  // All groups data cache for global dashboard & spending calculations
  allGroupBalances: Record<string, Record<string, MemberBalance>>
  allGroupExpenses: GroupExpense[]
  allGroupSettlements: Settlement[]

  // Modals
  isCreateGroupModalOpen: boolean
  isAddGroupExpenseModalOpen: boolean
  isSettleUpModalOpen: boolean
  isInviteModalOpen: boolean
  isAuditLogModalOpen: boolean

  // Actions
  openCreateGroupModal: () => void
  closeCreateGroupModal: () => void
  openAddGroupExpenseModal: () => void
  closeAddGroupExpenseModal: () => void
  openSettleUpModal: () => void
  closeSettleUpModal: () => void
  openInviteModal: () => void
  closeInviteModal: () => void
  openAuditLogModal: () => void
  closeAuditLogModal: () => void

  setActiveGroupId: (groupId: string | null) => void
  subscribeGroups: (userId: string) => () => void
  subscribeActiveGroupDetails: (groupId: string) => () => void
  createNewGroup: (name: string, description: string, creator: any) => Promise<Group>
  createGroupExpense: (groupId: string, expenseData: any) => Promise<GroupExpense>
  modifyGroupExpense: (groupId: string, expenseId: string, partial: any, actor: any) => Promise<void>
  removeGroupExpense: (groupId: string, expenseId: string, actor: any) => Promise<void>
  createGroupSettlement: (groupId: string, settlementData: any) => Promise<Settlement>
  exitGroup: (groupId: string, userId: string) => Promise<void>
}

export const useGroupStore = create<GroupState>((set, get) => {
  const groupCaches = new Map<string, GroupDataCache>()
  const groupUnsubs = new Map<string, Array<() => void>>()

  const syncAllGroupsToState = () => {
    const allBalances: Record<string, Record<string, MemberBalance>> = {}
    const allExpenses: GroupExpense[] = []
    const allSettlements: Settlement[] = []

    for (const [gid, c] of groupCaches.entries()) {
      allBalances[gid] = c.balances
      allExpenses.push(...c.expenses)
      allSettlements.push(...c.settlements)
    }

    const { activeGroupId } = get()
    const activeCache = activeGroupId ? groupCaches.get(activeGroupId) : null

    set({
      allGroupBalances: allBalances,
      allGroupExpenses: allExpenses,
      allGroupSettlements: allSettlements,
      ...(activeCache
        ? {
            activeGroupMembers: activeCache.members,
            activeGroupExpenses: activeCache.expenses,
            activeGroupSettlements: activeCache.settlements,
            activeGroupBalances: activeCache.balances,
            activeGroupProposedSettlements: simplifyDebts(Object.values(activeCache.balances)),
            activeGroupAuditLogs: activeCache.auditLogs || [],
          }
        : {}),
    })
  }

  const attachGroupListeners = (groupId: string) => {
    if (groupUnsubs.has(groupId)) return

    if (!groupCaches.has(groupId)) {
      groupCaches.set(groupId, {
        members: [],
        expenses: [],
        settlements: [],
        balances: {},
        auditLogs: [],
      })
    }

    const unsubs: Array<() => void> = []

    const recalculateAndSync = () => {
      const cache = groupCaches.get(groupId)
      if (!cache) return
      cache.balances = deriveGroupBalances(cache.members, cache.expenses, cache.settlements)
      syncAllGroupsToState()
    }

    unsubs.push(
      subscribeGroupMembers(groupId, (members) => {
        const c = groupCaches.get(groupId)
        if (c) {
          c.members = members
          recalculateAndSync()
        }
      })
    )

    unsubs.push(
      subscribeGroupExpenses(groupId, (expenses) => {
        const c = groupCaches.get(groupId)
        if (c) {
          c.expenses = expenses
          recalculateAndSync()
        }
      })
    )

    unsubs.push(
      subscribeGroupSettlements(groupId, (settlements) => {
        const c = groupCaches.get(groupId)
        if (c) {
          c.settlements = settlements
          recalculateAndSync()
        }
      })
    )

    unsubs.push(
      subscribeGroupAuditLogs(groupId, (auditLogs) => {
        const c = groupCaches.get(groupId)
        if (c) {
          c.auditLogs = auditLogs
          syncAllGroupsToState()
        }
      })
    )

    groupUnsubs.set(groupId, unsubs)
  }

  return {
    groups: [],
    isLoadingGroups: true,
    activeGroupId: null,
    activeGroup: null,
    activeGroupMembers: [],
    activeGroupExpenses: [],
    activeGroupSettlements: [],
    activeGroupBalances: {},
    activeGroupProposedSettlements: [],
    activeGroupAuditLogs: [],
    allGroupBalances: {},
    allGroupExpenses: [],
    allGroupSettlements: [],

    isCreateGroupModalOpen: false,
    isAddGroupExpenseModalOpen: false,
    isSettleUpModalOpen: false,
    isInviteModalOpen: false,
    isAuditLogModalOpen: false,

    openCreateGroupModal: () => set({ isCreateGroupModalOpen: true }),
    closeCreateGroupModal: () => set({ isCreateGroupModalOpen: false }),
    openAddGroupExpenseModal: () => set({ isAddGroupExpenseModalOpen: true }),
    closeAddGroupExpenseModal: () => set({ isAddGroupExpenseModalOpen: false }),
    openSettleUpModal: () => set({ isSettleUpModalOpen: true }),
    closeSettleUpModal: () => set({ isSettleUpModalOpen: false }),
    openInviteModal: () => set({ isInviteModalOpen: true }),
    closeInviteModal: () => set({ isInviteModalOpen: false }),
    openAuditLogModal: () => set({ isAuditLogModalOpen: true }),
    closeAuditLogModal: () => set({ isAuditLogModalOpen: false }),

    setActiveGroupId: (activeGroupId) => {
      set({ activeGroupId })
      if (activeGroupId && groupCaches.has(activeGroupId)) {
        const c = groupCaches.get(activeGroupId)!
        set({
          activeGroupMembers: c.members,
          activeGroupExpenses: c.expenses,
          activeGroupSettlements: c.settlements,
          activeGroupBalances: c.balances,
          activeGroupProposedSettlements: simplifyDebts(Object.values(c.balances)),
          activeGroupAuditLogs: c.auditLogs || [],
        })
      }
    },

    subscribeGroups: (userId: string) => {
      set({ isLoadingGroups: true })

      const unsubGroups = subscribeUserGroups(
        userId,
        (groups) => {
          set({ groups, isLoadingGroups: false })

          const currentGroupIds = new Set(groups.map((g) => g.id))

          // Clean up deleted groups
          for (const [gid, unsubs] of groupUnsubs.entries()) {
            if (!currentGroupIds.has(gid)) {
              unsubs.forEach((u) => u())
              groupUnsubs.delete(gid)
              groupCaches.delete(gid)
            }
          }

          // Attach listeners for all member groups
          groups.forEach((group) => {
            attachGroupListeners(group.id)
          })

          syncAllGroupsToState()
        },
        () => set({ isLoadingGroups: false })
      )

      return () => {
        unsubGroups()
        for (const unsubs of groupUnsubs.values()) {
          unsubs.forEach((u) => u())
        }
        groupUnsubs.clear()
        groupCaches.clear()
      }
    },

    subscribeActiveGroupDetails: (groupId: string) => {
      const unsubs: Array<() => void> = []

      // 1. Group Doc listener
      unsubs.push(
        subscribeGroup(groupId, (group) => {
          set({ activeGroup: group })
        })
      )

      // 2. Ensure group subcollection listeners are attached and active
      attachGroupListeners(groupId)

      return () => {
        unsubs.forEach((u) => u())
      }
    },

    createNewGroup: async (name, description, creator) => {
      return await createGroup(name, description, creator)
    },

    createGroupExpense: async (groupId, expenseData) => {
      return await addGroupExpense(groupId, expenseData)
    },

    modifyGroupExpense: async (groupId, expenseId, partial, actor) => {
      await updateGroupExpense(groupId, expenseId, partial, actor)
    },

    removeGroupExpense: async (groupId, expenseId, actor) => {
      await deleteGroupExpense(groupId, expenseId, actor)
    },

    createGroupSettlement: async (groupId, settlementData) => {
      return await recordGroupSettlement(groupId, settlementData)
    },

    exitGroup: async (groupId, userId) => {
      await leaveGroup(groupId, userId)
    },
  }
})
