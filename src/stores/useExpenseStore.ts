import { create } from 'zustand'
import { PersonalTransaction, TransactionCategory } from '@/types/expense'
import { DocumentSnapshot } from 'firebase/firestore'
import {
  subscribePersonalTransactions,
  fetchPersonalTransactionsPage,
  addPersonalTransaction,
  updatePersonalTransaction,
  deletePersonalTransaction,
  restorePersonalTransaction,
} from '@/services/firebase/expenseService'

interface ExpenseState {
  expenses: PersonalTransaction[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  lastDoc: DocumentSnapshot | null
  searchQuery: string
  selectedCategory: TransactionCategory | 'All'
  startDate: string | null
  endDate: string | null
  isAddExpenseSheetOpen: boolean
  editingExpense: PersonalTransaction | null

  // Actions
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: TransactionCategory | 'All') => void
  setDateRange: (start: string | null, end: string | null) => void
  openAddExpenseSheet: () => void
  closeAddExpenseSheet: () => void
  openEditExpense: (expense: PersonalTransaction) => void
  closeEditExpense: () => void
  subscribeExpenses: (userId: string) => () => void
  loadMoreExpenses: (userId: string) => Promise<void>
  createExpense: (data: Omit<PersonalTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PersonalTransaction>
  updateExpense: (expense: PersonalTransaction, partial: Partial<PersonalTransaction>) => Promise<void>
  removeExpense: (expense: PersonalTransaction) => Promise<void>
  restoreExpense: (expense: PersonalTransaction) => Promise<PersonalTransaction>
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
    const unsubscribe = subscribePersonalTransactions(
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
      const result = await fetchPersonalTransactionsPage(userId, 20, lastDoc)
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
    return await addPersonalTransaction(data)
  },

  updateExpense: async (expense: PersonalTransaction, partial: Partial<PersonalTransaction>) => {
    await updatePersonalTransaction(expense.id, partial, expense)
  },

  removeExpense: async (expense: PersonalTransaction) => {
    await deletePersonalTransaction(expense)
  },

  restoreExpense: async (expense: PersonalTransaction) => {
    return await restorePersonalTransaction(expense)
  },
}))
