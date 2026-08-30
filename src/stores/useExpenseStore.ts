import { create } from 'zustand'
import { PersonalExpense, ExpenseCategory } from '@/types/expense'
import { DocumentSnapshot } from 'firebase/firestore'
import {
  subscribePersonalExpenses,
  fetchPersonalExpensesPage,
  addPersonalExpense,
  updatePersonalExpense,
  deletePersonalExpense,
  restorePersonalExpense,
} from '@/services/firebase/expenseService'

interface ExpenseState {
  expenses: PersonalExpense[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  lastDoc: DocumentSnapshot | null
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
  loadMoreExpenses: (userId: string) => Promise<void>
  createExpense: (data: Omit<PersonalExpense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PersonalExpense>
  updateExpense: (expenseId: string, partial: Partial<PersonalExpense>) => Promise<void>
  removeExpense: (expenseId: string) => Promise<void>
  restoreExpense: (expense: PersonalExpense) => Promise<PersonalExpense>
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: true,
  isLoadingMore: false,
  hasMore: false,
  lastDoc: null,
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
        set({
          expenses,
          isLoading: false,
          hasMore: expenses.length >= 50,
        })
      },
      (error) => {
        console.warn('Expense subscription error:', error)
        set({ isLoading: false })
      }
    )
    return unsubscribe
  },

  loadMoreExpenses: async (userId: string) => {
    const { isLoadingMore, hasMore, lastDoc, expenses } = get()
    if (isLoadingMore || !hasMore) return

    set({ isLoadingMore: true })
    try {
      const result = await fetchPersonalExpensesPage(userId, 20, lastDoc)
      const existingIds = new Set(expenses.map((e) => e.id))
      const newItems = result.expenses.filter((e) => !existingIds.has(e.id))

      set({
        expenses: [...expenses, ...newItems],
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        isLoadingMore: false,
      })
    } catch (err) {
      console.warn('Load more expenses error:', err)
      set({ isLoadingMore: false })
    }
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

  restoreExpense: async (expense: PersonalExpense) => {
    return await restorePersonalExpense(expense)
  },
}))
