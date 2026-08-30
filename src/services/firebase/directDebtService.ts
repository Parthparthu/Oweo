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
import { DirectDebt } from '@/types/directDebt'
import { generateId } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

export const DEFAULT_DEBT_WINDOW_SIZE = 50

/**
 * Subscribes to a user's 1:1 direct debts.
 */
export function subscribeDirectDebts(
  userId: string,
  onUpdate: (debts: DirectDebt[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = DEFAULT_DEBT_WINDOW_SIZE
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const q = query(
    collection(db, 'directDebts'),
    where('creatorId', '==', userId),
    limit(limitCount)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const list: DirectDebt[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DirectDebt)
      })

      list.sort((a, b) => {
        const dateComp = (b.date || '').localeCompare(a.date || '')
        if (dateComp !== 0) return dateComp
        return (b.createdAt || 0) - (a.createdAt || 0)
      })

      onUpdate(list)
    },
    (err) => {
      console.warn('Direct debts subscription notice:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Creates a new 1:1 direct debt.
 */
export async function createDirectDebt(
  debtData: Omit<DirectDebt, 'id' | 'createdAt' | 'updatedAt' | 'isSettled' | 'settledAt'>
): Promise<DirectDebt> {
  if (!db) throw new Error('Database is not initialized')

  const id = generateId('debt')
  const now = Date.now()

  const debt: DirectDebt = {
    ...debtData,
    id,
    isSettled: false,
    settledAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const docRef = doc(db, 'directDebts', id)
  await setDoc(docRef, sanitizeForFirestore(debt))
  return debt
}

/**
 * Marks a 1:1 direct debt as settled.
 */
export async function settleDirectDebt(debtId: string): Promise<void> {
  if (!db) return
  const now = Date.now()
  const docRef = doc(db, 'directDebts', debtId)
  await updateDoc(docRef, {
    isSettled: true,
    settledAt: now,
    updatedAt: now,
  })
}

/**
 * Reopens / un-settles a direct debt.
 */
export async function unSettleDirectDebt(debtId: string): Promise<void> {
  if (!db) return
  const now = Date.now()
  const docRef = doc(db, 'directDebts', debtId)
  await updateDoc(docRef, {
    isSettled: false,
    settledAt: null,
    updatedAt: now,
  })
}

/**
 * Deletes a 1:1 direct debt.
 */
export async function deleteDirectDebt(debtId: string): Promise<void> {
  if (!db) return
  const docRef = doc(db, 'directDebts', debtId)
  await deleteDoc(docRef)
}

/**
 * Restores a deleted 1:1 direct debt (for Undo).
 */
export async function restoreDirectDebt(debt: DirectDebt): Promise<DirectDebt> {
  if (!db) throw new Error('Database is not initialized')
  const docRef = doc(db, 'directDebts', debt.id)
  await setDoc(docRef, sanitizeForFirestore(debt))
  return debt
}
