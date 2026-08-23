import { GroupExpense } from '@/types/expense'
import { GroupMember } from '@/types/group'
import { MemberBalance, ProposedSettlement, Settlement, UserDebtSummary } from '@/types/settlement'

/**
 * Derives net balances for each member in a group based on all expenses and recorded settlements.
 */
export function deriveGroupBalances(
  members: GroupMember[],
  expenses: GroupExpense[],
  settlements: Settlement[]
): Record<string, MemberBalance> {
  const balanceMap: Record<string, MemberBalance> = {}

  // Initialize all known members
  members.forEach((m) => {
    balanceMap[m.userId] = {
      userId: m.userId,
      displayName: m.displayName,
      photoURL: m.photoURL,
      netBalancePaise: 0,
      totalPaidPaise: 0,
      totalOwedPaise: 0,
    }
  })

  // Process all group expenses
  expenses.forEach((expense) => {
    const payerId = expense.payerId
    const amount = expense.amountPaise

    // If payer not in initial map, register them
    if (!balanceMap[payerId]) {
      balanceMap[payerId] = {
        userId: payerId,
        displayName: expense.payerSnapshot.displayName,
        photoURL: expense.payerSnapshot.photoURL,
        netBalancePaise: 0,
        totalPaidPaise: 0,
        totalOwedPaise: 0,
      }
    }

    balanceMap[payerId].totalPaidPaise += amount
    balanceMap[payerId].netBalancePaise += amount

    // Process participant shares
    Object.entries(expense.participants).forEach(([participantId, share]) => {
      if (!balanceMap[participantId]) {
        balanceMap[participantId] = {
          userId: participantId,
          displayName: share.displayNameSnapshot || 'Unknown',
          photoURL: share.photoURLSnapshot,
          netBalancePaise: 0,
          totalPaidPaise: 0,
          totalOwedPaise: 0,
        }
      }

      balanceMap[participantId].totalOwedPaise += share.amountPaise
      balanceMap[participantId].netBalancePaise -= share.amountPaise
    })
  })

  // Process all manual settlements
  settlements.forEach((settlement) => {
    const { payerId, receiverId, amountPaise, payerSnapshot, receiverSnapshot } = settlement

    if (!balanceMap[payerId]) {
      balanceMap[payerId] = {
        userId: payerId,
        displayName: payerSnapshot.displayName,
        photoURL: payerSnapshot.photoURL,
        netBalancePaise: 0,
        totalPaidPaise: 0,
        totalOwedPaise: 0,
      }
    }
    if (!balanceMap[receiverId]) {
      balanceMap[receiverId] = {
        userId: receiverId,
        displayName: receiverSnapshot.displayName,
        photoURL: receiverSnapshot.photoURL,
        netBalancePaise: 0,
        totalPaidPaise: 0,
        totalOwedPaise: 0,
      }
    }

    // Payer paid back receiver, so payer's debt is reduced (+netBalance)
    balanceMap[payerId].netBalancePaise += amountPaise
    // Receiver received back money, so receiver's credit is reduced (-netBalance)
    balanceMap[receiverId].netBalancePaise -= amountPaise
  })

  return balanceMap
}

/**
 * Greedy Debt Simplification Algorithm
 * Simplifies pairwise debts into minimal transactions without altering net positions.
 */
export function simplifyDebts(balances: MemberBalance[]): ProposedSettlement[] {
  interface NetNode {
    userId: string
    name: string
    photo?: string | null
    amount: number // positive for creditor, negative for debtor
  }

  const creditors: NetNode[] = []
  const debtors: NetNode[] = []

  balances.forEach((b) => {
    // Round to avoid negligible fractions
    const rounded = Math.round(b.netBalancePaise)
    if (rounded > 0) {
      creditors.push({
        userId: b.userId,
        name: b.displayName,
        photo: b.photoURL,
        amount: rounded,
      })
    } else if (rounded < 0) {
      debtors.push({
        userId: b.userId,
        name: b.displayName,
        photo: b.photoURL,
        amount: -rounded, // store as positive amount owed
      })
    }
  })

  // Sort descending by magnitude
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const proposed: ProposedSettlement[] = []

  let cIdx = 0
  let dIdx = 0

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx]
    const debtor = debtors[dIdx]

    if (creditor.userId === debtor.userId) {
      // Self-debt guard
      dIdx++
      continue
    }

    const settleAmount = Math.min(creditor.amount, debtor.amount)
    if (settleAmount > 0) {
      proposed.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        fromPhoto: debtor.photo,
        toUserId: creditor.userId,
        toName: creditor.name,
        toPhoto: creditor.photo,
        amountPaise: settleAmount,
      })
    }

    creditor.amount -= settleAmount
    debtor.amount -= settleAmount

    if (creditor.amount === 0) cIdx++
    if (debtor.amount === 0) dIdx++
  }

  return proposed
}

/**
 * Derives aggregate "Who owes you" and "Who you owe" summary for a specific user across all groups.
 */
export function deriveUserCrossGroupDebts(
  currentUserId: string,
  groupData: Array<{
    groupId: string
    groupName: string
    balances: Record<string, MemberBalance>
    lastActivityDate?: string
  }>
): {
  owedToUser: UserDebtSummary[]
  userOwes: UserDebtSummary[]
  totalOwedToUserPaise: number
  totalUserOwesPaise: number
  netPositionPaise: number
} {
  const owedToUser: UserDebtSummary[] = []
  const userOwes: UserDebtSummary[] = []
  let totalOwedToUserPaise = 0
  let totalUserOwesPaise = 0

  groupData.forEach(({ groupId, groupName, balances, lastActivityDate }) => {
    const userBalance = balances[currentUserId]
    if (!userBalance) return

    const proposed = simplifyDebts(Object.values(balances))
    proposed.forEach((p) => {
      if (p.toUserId === currentUserId) {
        // Someone owes current user
        owedToUser.push({
          userId: p.fromUserId,
          displayName: p.fromName,
          photoURL: p.fromPhoto,
          groupId,
          groupName,
          amountPaise: p.amountPaise,
          type: 'you_are_owed',
          lastActivityDate,
        })
        totalOwedToUserPaise += p.amountPaise
      } else if (p.fromUserId === currentUserId) {
        // Current user owes someone
        userOwes.push({
          userId: p.toUserId,
          displayName: p.toName,
          photoURL: p.toPhoto,
          groupId,
          groupName,
          amountPaise: p.amountPaise,
          type: 'you_owe',
          lastActivityDate,
        })
        totalUserOwesPaise += p.amountPaise
      }
    })
  })

  return {
    owedToUser,
    userOwes,
    totalOwedToUserPaise,
    totalUserOwesPaise,
    netPositionPaise: totalOwedToUserPaise - totalUserOwesPaise,
  }
}
