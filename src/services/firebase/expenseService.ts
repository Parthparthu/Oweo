import {
  collection,
  doc,
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
import { PersonalTransaction } from '@/types/expense'
import { generateId } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

export const DEFAULT_EXPENSE_WINDOW_SIZE = 50
export const DEFAULT_PAGE_SIZE = 20

export interface ExpensePageResult {
  expenses: PersonalTransaction[]
  lastDoc: DocumentSnapshot | null
  hasMore: boolean
}

/**
 * Subscribes to a bounded real-time window for a user's personal expenses.
 * Uses bounded queries (limit) and in-memory sort to eliminate unbounded read costs.
 */
export function subscribePersonalTransactions(
  userId: string,
  onUpdate: (expenses: PersonalTransaction[]) => void,
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
      const list: PersonalTransaction[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as PersonalTransaction)
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
export async function fetchPersonalTransactionsPage(
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

  const list: PersonalTransaction[] = resultDocs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as PersonalTransaction[]

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
 * Adds a new personal expense/income transaction.
 */
export async function addPersonalTransaction(
  expenseData: Omit<PersonalTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PersonalTransaction> {
  if (!db) {
    throw new Error('Database is not initialized.')
  }

  const { writeBatch, increment } = await import('firebase/firestore')

  const id = generateId('exp')
  const now = Date.now()
  const expense: PersonalTransaction = {
    ...expenseData,
    id,
    createdAt: now,
    updatedAt: now,
  }

  const batch = writeBatch(db)
  const docRef = doc(db, 'expenses', id)
  batch.set(docRef, sanitizeForFirestore(expense))

  // Update wallet balance
  const userRef = doc(db, 'users', expenseData.userId)
  const delta = expenseData.type === 'INCOME' ? expenseData.amountPaise : -expenseData.amountPaise
  batch.update(userRef, { walletBalancePaise: increment(delta) })

  await batch.commit()
  return expense
}

/**
 * Updates an existing personal expense/income transaction.
 */
export async function updatePersonalTransaction(
  expenseId: string,
  partial: Partial<PersonalTransaction>,
  oldExpense: PersonalTransaction
): Promise<void> {
  if (!db) return
  
  const { writeBatch, increment } = await import('firebase/firestore')
  const batch = writeBatch(db)

  const docRef = doc(db, 'expenses', expenseId)
  batch.update(
    docRef,
    sanitizeForFirestore({
      ...partial,
      updatedAt: Date.now(),
    })
  )

  // If amount or type changed, we must adjust the wallet balance
  let delta = 0
  const oldImpact = oldExpense.type === 'INCOME' ? oldExpense.amountPaise : -oldExpense.amountPaise
  
  const newType = partial.type ?? oldExpense.type
  const newAmount = partial.amountPaise ?? oldExpense.amountPaise
  const newImpact = newType === 'INCOME' ? newAmount : -newAmount

  delta = newImpact - oldImpact

  if (delta !== 0) {
    const userRef = doc(db, 'users', oldExpense.userId)
    batch.update(userRef, { walletBalancePaise: increment(delta) })
  }

  await batch.commit()
}

/**
 * Restores a deleted personal expense/income (used for Undo).
 */
export async function restorePersonalTransaction(expense: PersonalTransaction): Promise<PersonalTransaction> {
  if (!db) throw new Error('Database is not initialized.')
  
  const { writeBatch, increment } = await import('firebase/firestore')
  const batch = writeBatch(db)

  const docRef = doc(db, 'expenses', expense.id)
  batch.set(docRef, sanitizeForFirestore(expense))

  const userRef = doc(db, 'users', expense.userId)
  const delta = expense.type === 'INCOME' ? expense.amountPaise : -expense.amountPaise
  batch.update(userRef, { walletBalancePaise: increment(delta) })

  await batch.commit()
  return expense
}

/**
 * Deletes a personal expense/income by ID.
 */
export async function deletePersonalTransaction(expense: PersonalTransaction): Promise<void> {
  if (!db) return
  
  const { writeBatch, increment } = await import('firebase/firestore')
  const batch = writeBatch(db)

  const docRef = doc(db, 'expenses', expense.id)
  batch.delete(docRef)

  // Reverse the impact
  const userRef = doc(db, 'users', expense.userId)
  const delta = expense.type === 'INCOME' ? -expense.amountPaise : expense.amountPaise
  batch.update(userRef, { walletBalancePaise: increment(delta) })

  await batch.commit()
}
