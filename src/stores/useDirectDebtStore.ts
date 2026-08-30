import { create } from 'zustand'
import { DirectDebt } from '@/types/directDebt'
import {
  subscribeDirectDebts,
  createDirectDebt,
  settleDirectDebt,
  unSettleDirectDebt,
  deleteDirectDebt,
  restoreDirectDebt,
} from '@/services/firebase/directDebtService'

interface DirectDebtState {
  directDebts: DirectDebt[]
  isLoadingDebts: boolean
  isAddDirectDebtModalOpen: boolean

  // Actions
  openAddDirectDebtModal: () => void
  closeAddDirectDebtModal: () => void
  subscribeDebts: (userId: string) => () => void
  addDebt: (
    data: Omit<DirectDebt, 'id' | 'createdAt' | 'updatedAt' | 'isSettled' | 'settledAt'>
  ) => Promise<DirectDebt>
  markSettled: (debtId: string) => Promise<void>
  unMarkSettled: (debtId: string) => Promise<void>
  removeDebt: (debtId: string) => Promise<void>
  restoreDebt: (debt: DirectDebt) => Promise<DirectDebt>
}

export const useDirectDebtStore = create<DirectDebtState>((set) => ({
  directDebts: [],
  isLoadingDebts: true,
  isAddDirectDebtModalOpen: false,

  openAddDirectDebtModal: () => set({ isAddDirectDebtModalOpen: true }),
  closeAddDirectDebtModal: () => set({ isAddDirectDebtModalOpen: false }),

  subscribeDebts: (userId: string) => {
    set({ isLoadingDebts: true })
    const unsubscribe = subscribeDirectDebts(
      userId,
      (directDebts) => {
        set({ directDebts, isLoadingDebts: false })
      },
      (error) => {
        console.warn('Direct debts subscription error:', error)
        set({ isLoadingDebts: false })
      }
    )
    return unsubscribe
  },

  addDebt: async (data) => {
    return await createDirectDebt(data)
  },

  markSettled: async (debtId) => {
    await settleDirectDebt(debtId)
  },

  unMarkSettled: async (debtId) => {
    await unSettleDirectDebt(debtId)
  },

  removeDebt: async (debtId) => {
    await deleteDirectDebt(debtId)
  },

  restoreDebt: async (debt) => {
    return await restoreDirectDebt(debt)
  },
}))
