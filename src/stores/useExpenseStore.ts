import { create } from 'zustand'
import { PersonalExpense, ExpenseCategory } from '@/types/expense'
import {
  subscribePersonalExpenses,
  addPersonalExpense,
  updatePersonalExpense,
  deletePersonalExpense,
} from '@/services/firebase/expenseService'

interface ExpenseState {
  expenses: PersonalExpense[]
  isLoading: boolean
  searchQuery: string
  selectedCategory: ExpenseCategory | 'All'
  startDate: string | null
  endDate: string | null
  isAddExpenseSheetOpen: boolean
  editingExpense: PersonalExpense | null

  // Actions
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: ExpenseCategory | 'All') => void
  setDateRange: (start: string | null, end: string | null) => void
  openAddExpenseSheet: () => void
  closeAddExpenseSheet: () => void
  openEditExpense: (expense: PersonalExpense) => void
  closeEditExpense: () => void
  subscribeExpenses: (userId: string) => () => void
  createExpense: (data: Omit<PersonalExpense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PersonalExpense>
  updateExpense: (expenseId: string, partial: Partial<PersonalExpense>) => Promise<void>
  removeExpense: (expenseId: string) => Promise<void>
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  isLoading: true,
  searchQuery: '',
  selectedCategory: 'All',
  startDate: null,
  endDate: null,
  isAddExpenseSheetOpen: false,
  editingExpense: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setDateRange: (startDate, endDate) => set({ startDate, endDate }),

  openAddExpenseSheet: () => set({ isAddExpenseSheetOpen: true, editingExpense: null }),
  closeAddExpenseSheet: () => set({ isAddExpenseSheetOpen: false }),

  openEditExpense: (expense) => set({ editingExpense: expense, isAddExpenseSheetOpen: false }),
  closeEditExpense: () => set({ editingExpense: null }),

  subscribeExpenses: (userId: string) => {
    set({ isLoading: true })
    const unsubscribe = subscribePersonalExpenses(
      userId,
      (expenses) => {
        set({ expenses, isLoading: false })
      },
      (error) => {
        console.warn('Expense subscription error:', error)
        set({ isLoading: false })
      }
    )
    return unsubscribe
  },

  createExpense: async (data) => {
    return await addPersonalExpense(data)
  },

  updateExpense: async (expenseId, partial) => {
    await updatePersonalExpense(expenseId, partial)
  },

  removeExpense: async (expenseId) => {
    await deletePersonalExpense(expenseId)
  },
}))
