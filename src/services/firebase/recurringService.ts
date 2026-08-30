import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { RecurringExpense } from '@/types/recurring'
import { generateId } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

export const DEFAULT_RECURRING_WINDOW = 50

/**
 * Subscribes to a user's active recurring expenses and subscriptions.
 */
export function subscribeRecurringExpenses(
  userId: string,
  onUpdate: (items: RecurringExpense[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const q = query(
    collection(db, 'recurringExpenses'),
    where('userId', '==', userId),
    limit(DEFAULT_RECURRING_WINDOW)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const list: RecurringExpense[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as RecurringExpense)
      })

      list.sort((a, b) => (a.billingDay || 1) - (b.billingDay || 1))
      onUpdate(list)
    },
    (err) => {
      console.warn('Recurring expenses subscription notice:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Creates a new recurring expense or subscription.
 */
export async function createRecurringExpense(
  data: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RecurringExpense> {
  if (!db) throw new Error('Database is not initialized')

  const id = generateId('rec')
  const now = Date.now()

  const recurring: RecurringExpense = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = doc(db, 'recurringExpenses', id)
  await setDoc(docRef, sanitizeForFirestore(recurring))
  return recurring
}

/**
 * Updates a recurring expense.
 */
export async function updateRecurringExpense(
  id: string,
  data: Partial<Omit<RecurringExpense, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  if (!db) return
  const docRef = doc(db, 'recurringExpenses', id)
  await updateDoc(docRef, sanitizeForFirestore({
    ...data,
    updatedAt: Date.now(),
  }))
}

/**
 * Toggles active state of a recurring bill.
 */
export async function toggleRecurringExpenseActive(
  id: string,
  isActive: boolean
): Promise<void> {
  if (!db) return
  const docRef = doc(db, 'recurringExpenses', id)
  await updateDoc(docRef, {
    isActive,
    updatedAt: Date.now(),
  })
}

/**
 * Deletes a recurring expense.
 */
export async function deleteRecurringExpense(id: string): Promise<void> {
  if (!db) return
  const docRef = doc(db, 'recurringExpenses', id)
  await deleteDoc(docRef)
}
