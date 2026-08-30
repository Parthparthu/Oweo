import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { PersonalExpense } from '@/types/expense'
import { generateId } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

export const DEFAULT_EXPENSE_WINDOW_SIZE = 50
export const DEFAULT_PAGE_SIZE = 20

export interface ExpensePageResult {
  expenses: PersonalExpense[]
  lastDoc: DocumentSnapshot | null
  hasMore: boolean
}

/**
 * Subscribes to a bounded real-time window for a user's personal expenses.
 * Uses bounded queries (limit) and in-memory sort to eliminate unbounded read costs.
 */
export function subscribePersonalExpenses(
  userId: string,
  onUpdate: (expenses: PersonalExpense[]) => void,
  onError?: (error: Error) => void,
  windowSize: number = DEFAULT_EXPENSE_WINDOW_SIZE
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  // Single-field equality filter with bounded limit
  const q = query(
    collection(db, 'expenses'),
    where('userId', '==', userId),
    limit(windowSize)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PersonalExpense[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PersonalExpense)
      })

      // In-memory sort by date descending, then createdAt descending
      list.sort((a, b) => {
        const dateComp = (b.date || '').localeCompare(a.date || '')
        if (dateComp !== 0) return dateComp
        return (b.createdAt || 0) - (a.createdAt || 0)
      })

      onUpdate(list)
    },
    (err) => {
      console.warn('Personal expenses sync notice:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Fetches a paginated page of personal expenses using cursor-based pagination.
 */
export async function fetchPersonalExpensesPage(
  userId: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
  lastDoc?: DocumentSnapshot | null
): Promise<ExpensePageResult> {
  if (!db) {
    return { expenses: [], lastDoc: null, hasMore: false }
  }

  let q = query(
    collection(db, 'expenses'),
    where('userId', '==', userId),
    limit(pageSize + 1)
  )

  if (lastDoc) {
    q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      startAfter(lastDoc),
      limit(pageSize + 1)
    )
  }

  const snapshot = await getDocs(q)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const resultDocs = hasMore ? docs.slice(0, pageSize) : docs

  const list: PersonalExpense[] = resultDocs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as PersonalExpense[]

  list.sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '')
    if (dateComp !== 0) return dateComp
    return (b.createdAt || 0) - (a.createdAt || 0)
  })

  const newLastDoc = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null

  return {
    expenses: list,
    lastDoc: newLastDoc,
    hasMore,
  }
}

/**
 * Adds a new personal expense.
 */
export async function addPersonalExpense(
  expenseData: Omit<PersonalExpense, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PersonalExpense> {
  if (!db) {
    throw new Error('Database is not initialized.')
  }

  const id = generateId('exp')
  const now = Date.now()
  const expense: PersonalExpense = {
    ...expenseData,
    id,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = doc(db, 'expenses', id)
  await setDoc(docRef, sanitizeForFirestore(expense))
  return expense
}

/**
 * Updates an existing personal expense.
 */
export async function updatePersonalExpense(
  expenseId: string,
  partial: Partial<PersonalExpense>
): Promise<void> {
  if (!db) return
  const docRef = doc(db, 'expenses', expenseId)
  await updateDoc(
    docRef,
    sanitizeForFirestore({
      ...partial,
      updatedAt: Date.now(),
    })
  )
}

/**
 * Restores a deleted personal expense (used for Undo).
 */
export async function restorePersonalExpense(expense: PersonalExpense): Promise<PersonalExpense> {
  if (!db) throw new Error('Database is not initialized.')
  const docRef = doc(db, 'expenses', expense.id)
  await setDoc(docRef, sanitizeForFirestore(expense))
  return expense
}

/**
 * Deletes a personal expense by ID.
 */
export async function deletePersonalExpense(expenseId: string): Promise<void> {
  if (!db) return
  const docRef = doc(db, 'expenses', expenseId)
  await deleteDoc(docRef)
}
