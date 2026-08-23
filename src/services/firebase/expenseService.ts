import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { PersonalExpense } from '@/types/expense'
import { generateId } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

/**
 * Subscribes to real-time updates for a user's personal expenses.
 * Uses in-memory sort to eliminate composite index requirement.
 */
export function subscribePersonalExpenses(
  userId: string,
  onUpdate: (expenses: PersonalExpense[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  // Single-field equality filter (no composite index required)
  const q = query(
    collection(db, 'expenses'),
    where('userId', '==', userId)
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
 * Deletes a personal expense by ID.
 */
export async function deletePersonalExpense(expenseId: string): Promise<void> {
  if (!db) return
  const docRef = doc(db, 'expenses', expenseId)
  await deleteDoc(docRef)
}
