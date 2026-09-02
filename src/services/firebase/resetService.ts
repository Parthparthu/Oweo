import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore'
import { db } from './config'

/**
 * Wipes all test data created by the current user (expenses, directDebts, recurring, created groups, invites).
 */
export async function resetCurrentUserData(userId: string): Promise<void> {
  if (!db || !userId) return

  const batch = writeBatch(db)

  // 1. Delete all personal expenses
  const expenseQ = query(collection(db, 'expenses'), where('userId', '==', userId))
  const expenseDocs = await getDocs(expenseQ)
  expenseDocs.forEach((d) => batch.delete(d.ref))

  // 2. Delete 1:1 direct debts
  const debtQ = query(collection(db, 'directDebts'), where('creatorId', '==', userId))
  const debtDocs = await getDocs(debtQ)
  debtDocs.forEach((d) => batch.delete(d.ref))

  // 3. Delete recurring expenses
  const recurringQ = query(collection(db, 'recurringExpenses'), where('userId', '==', userId))
  const recurringDocs = await getDocs(recurringQ)
  recurringDocs.forEach((d) => batch.delete(d.ref))

  // 4. Delete groups created by user
  const groupQ = query(collection(db, 'groups'), where('createdBy', '==', userId))
  const groupDocs = await getDocs(groupQ)
  groupDocs.forEach((d) => batch.delete(d.ref))

  // 5. Delete invites created by user
  const inviteQ = query(collection(db, 'invites'), where('createdBy', '==', userId))
  const inviteDocs = await getDocs(inviteQ)
  inviteDocs.forEach((d) => batch.delete(d.ref))

  // 6. Reset wallet balance in user profile
  const userRef = doc(db, 'users', userId)
  batch.update(userRef, {
    walletBalancePaise: 0,
    updatedAt: Date.now(),
  })

  await batch.commit()
}
