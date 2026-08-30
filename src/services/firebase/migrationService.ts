import { doc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './config'
import { PersonalTransaction } from '@/types/expense'
import { generateId } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

/**
 * Calculates initial balance for migrating legacy budget to wallet:
 * Initial Balance = monthlyBudgetPaise - sum(EXPENSE) + sum(INCOME)
 */
export function calculateMigrationInitialBalance(
  monthlyBudgetPaise: number,
  existingTransactions: Array<{ amountPaise?: number; type?: 'INCOME' | 'EXPENSE' }>
): {
  totalExpensesPaise: number
  totalIncomePaise: number
  initialBalancePaise: number
} {
  const budget = Math.round(Number(monthlyBudgetPaise) || 0)
  let totalExpensesPaise = 0
  let totalIncomePaise = 0

  existingTransactions.forEach((t) => {
    const amount = Math.round(Number(t.amountPaise) || 0)
    if (!t.type || t.type === 'EXPENSE') {
      totalExpensesPaise += amount
    } else if (t.type === 'INCOME') {
      totalIncomePaise += amount
    }
  })

  const initialBalancePaise = budget + totalIncomePaise - totalExpensesPaise
  return {
    totalExpensesPaise,
    totalIncomePaise,
    initialBalancePaise,
  }
}

export async function migrateUserWallet(userId: string) {
  if (!db) return

  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  
  if (!userSnap.exists()) return

  const userData = userSnap.data()
  
  // If already migrated, skip
  if (userData.isWalletMigrated) return

  // If there's an old monthly budget, use it; otherwise assume 0
  const monthlyBudgetPaise = Math.round(Number(userData.monthlyBudgetPaise) || 0)

  // 1. Get all existing expenses for this user to calculate total spent
  const expensesQuery = query(
    collection(db, 'expenses'),
    where('userId', '==', userId)
  )
  const expensesSnap = await getDocs(expensesQuery)
  
  const existingRecords: Array<{ amountPaise?: number; type?: 'INCOME' | 'EXPENSE' }> = []
  expensesSnap.forEach(docSnap => {
    const data = docSnap.data()
    existingRecords.push({
      amountPaise: data.amountPaise,
      type: data.type,
    })
  })

  const { initialBalancePaise } = calculateMigrationInitialBalance(
    monthlyBudgetPaise,
    existingRecords
  )

  const batch = writeBatch(db)

  // 2. Create an Initial Balance INCOME transaction representing their historical budget capital
  if (monthlyBudgetPaise > 0) {
    const initId = generateId('exp')
    const now = Date.now()
    const initialIncome: PersonalTransaction = {
      id: initId,
      userId,
      type: 'INCOME',
      amountPaise: monthlyBudgetPaise, // Give them their budget as an income
      category: 'Pocket Money',
      title: 'Initial Migration Balance',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Other',
      note: 'Auto-generated during wallet migration',
      createdAt: now,
      updatedAt: now,
    }
    const docRef = doc(db, 'expenses', initId)
    batch.set(docRef, sanitizeForFirestore(initialIncome))
  }

  // 3. Update the user document: assign wallet balance and set isWalletMigrated to true
  batch.update(userRef, {
    walletBalancePaise: initialBalancePaise,
    isWalletMigrated: true,
  })

  await batch.commit()
  console.log('Successfully migrated wallet for user ' + userId)
}
