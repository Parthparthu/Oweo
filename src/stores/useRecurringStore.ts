import { create } from 'zustand'
import { RecurringExpense, DetectedRecurringPattern } from '@/types/recurring'
import { PersonalTransaction } from '@/types/expense'
import {
  subscribeRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  toggleRecurringExpenseActive,
  deleteRecurringExpense,
} from '@/services/firebase/recurringService'
import { detectRecurringExpenses } from '@/domain/expenses/recurringDetector'

interface RecurringState {
  recurringExpenses: RecurringExpense[]
  detectedPatterns: DetectedRecurringPattern[]
  isLoading: boolean
  isAddModalOpen: boolean

  // Actions
  openAddModal: () => void
  closeAddModal: () => void
  subscribe: (userId: string) => () => void
  addRecurring: (
    data: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<RecurringExpense>
  editRecurring: (
    id: string,
    data: Partial<Omit<RecurringExpense, 'id' | 'userId' | 'createdAt'>>
  ) => Promise<void>
  toggleActive: (id: string, isActive: boolean) => Promise<void>
  removeRecurring: (id: string) => Promise<void>
  scanForPatterns: (expenses: PersonalTransaction[]) => void
  dismissPattern: (title: string, amountPaise: number) => void
  acceptPattern: (
    pattern: DetectedRecurringPattern,
    userId: string
  ) => Promise<RecurringExpense>
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  recurringExpenses: [],
  detectedPatterns: [],
  isLoading: true,
  isAddModalOpen: false,

  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),

  subscribe: (userId: string) => {
    set({ isLoading: true })
    const unsub = subscribeRecurringExpenses(
      userId,
      (items) => {
        set({ recurringExpenses: items, isLoading: false })
      },
      (err) => {
        console.warn('Recurring store subscription error:', err)
        set({ isLoading: false })
      }
    )
    return unsub
  },

  addRecurring: async (data) => {
    const created = await createRecurringExpense(data)
    // Remove from detected patterns if matching
    set((state) => ({
      detectedPatterns: state.detectedPatterns.filter(
        (p) => !(p.title.toLowerCase() === data.title.toLowerCase() && p.amountPaise === data.amountPaise)
      ),
    }))
    return created
  },

  editRecurring: async (id, data) => {
    await updateRecurringExpense(id, data)
  },

  toggleActive: async (id, isActive) => {
    await toggleRecurringExpenseActive(id, isActive)
  },

  removeRecurring: async (id) => {
    await deleteRecurringExpense(id)
  },

  scanForPatterns: (expenses: PersonalTransaction[]) => {
    const { recurringExpenses } = get()
    const detected = detectRecurringExpenses(expenses, recurringExpenses)
    set({ detectedPatterns: detected })
  },

  dismissPattern: (title: string, amountPaise: number) => {
    set((state) => ({
      detectedPatterns: state.detectedPatterns.filter(
        (p) => !(p.title === title && p.amountPaise === amountPaise)
      ),
    }))
  },

  acceptPattern: async (pattern, userId) => {
    const now = new Date()
    const dueDay = pattern.suggestedBillingDay
    let dueMonth = now.getMonth()
    let dueYear = now.getFullYear()

    if (now.getDate() > dueDay) {
      dueMonth += 1
      if (dueMonth > 11) {
        dueMonth = 0
        dueYear += 1
      }
    }

    const nextDueDate = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

    const created = await createRecurringExpense({
      userId,
      title: pattern.title,
      amountPaise: pattern.amountPaise,
      category: pattern.category,
      frequency: pattern.frequency,
      billingDay: pattern.suggestedBillingDay,
      nextDueDate,
      isActive: true,
    })

    set((state) => ({
      detectedPatterns: state.detectedPatterns.filter(
        (p) => !(p.title === pattern.title && p.amountPaise === pattern.amountPaise)
      ),
    }))

    return created
  },
}))
