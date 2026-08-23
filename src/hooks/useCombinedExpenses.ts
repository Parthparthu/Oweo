import { useMemo } from 'react'
import { PersonalExpense } from '@/types/expense'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Hook that returns the user's out-of-pocket financial transactions:
 * 1. Direct Personal Expenses: All private expenses.
 * 2. Group Upfront Expenses: If user was the payer, full upfront amount (+₹100).
 * 3. Group Settlements Paid by User: When user settles their debt (+₹50).
 * 4. Group Settlements Received by User: When user receives reimbursement (-₹50),
 *    which offsets the upfront payment from ₹100 down to ₹50!
 */
export function useCombinedExpenses(): PersonalExpense[] {
  const personalExpenses = useExpenseStore((state) => state.expenses)
  const allGroupExpenses = useGroupStore((state) => state.allGroupExpenses)
  const allGroupSettlements = useGroupStore((state) => state.allGroupSettlements)
  const groups = useGroupStore((state) => state.groups)
  const user = useAuthStore((state) => state.user)

  return useMemo(() => {
    if (!user) return personalExpenses

    const groupMap = new Map<string, string>()
    groups.forEach((g) => groupMap.set(g.id, g.name))

    const computedItems: PersonalExpense[] = []

    // 1. Group Expenses where current user was the UPFRONT PAYER (e.g. +₹100)
    allGroupExpenses.forEach((gExp) => {
      if (gExp.payerId === user.uid && gExp.amountPaise > 0) {
        const groupName = groupMap.get(gExp.groupId) || 'Group'
        computedItems.push({
          id: `gexp_${gExp.id}`,
          userId: user.uid,
          amountPaise: gExp.amountPaise,
          category: gExp.category || 'Food',
          title: gExp.title,
          date: gExp.date,
          paymentMethod: 'UPI',
          isGroupExpense: true,
          groupId: gExp.groupId,
          groupExpenseId: gExp.id,
          groupName,
          note: gExp.note
            ? `${gExp.note} • ${groupName} (Paid upfront)`
            : `${groupName} (Paid upfront)`,
          createdAt: gExp.createdAt,
          updatedAt: gExp.updatedAt,
        })
      }
    })

    // 2. Group Settlements
    allGroupSettlements.forEach((stl) => {
      const groupName = groupMap.get(stl.groupId) || 'Group'

      // Case A: User paid a settlement (+₹50 out-of-pocket expense)
      if (stl.payerId === user.uid && stl.amountPaise > 0) {
        computedItems.push({
          id: `stl_pay_${stl.id}`,
          userId: user.uid,
          amountPaise: stl.amountPaise,
          category: 'Settlement',
          title: `Settled with ${stl.receiverSnapshot?.displayName || 'Member'}`,
          date: stl.date,
          paymentMethod: 'UPI',
          isGroupExpense: true,
          groupId: stl.groupId,
          groupName,
          note: stl.note ? `${stl.note} • In ${groupName}` : `Paid debt in ${groupName}`,
          createdAt: stl.createdAt,
          updatedAt: stl.createdAt,
        })
      }

      // Case B: User received a settlement reimbursement (-₹50 credit, reduces ₹100 -> ₹50)
      if (stl.receiverId === user.uid && stl.amountPaise > 0) {
        computedItems.push({
          id: `stl_rec_${stl.id}`,
          userId: user.uid,
          amountPaise: -stl.amountPaise, // Negative amount reduces total spending
          category: 'Settlement',
          title: `Reimbursement from ${stl.payerSnapshot?.displayName || 'Member'}`,
          date: stl.date,
          paymentMethod: 'UPI',
          isGroupExpense: true,
          groupId: stl.groupId,
          groupName,
          note: stl.note ? `${stl.note} • In ${groupName}` : `Received reimbursement in ${groupName}`,
          createdAt: stl.createdAt,
          updatedAt: stl.createdAt,
        })
      }
    })

    // Combine with personal expenses and sort by date descending, then createdAt descending
    const combined = [...personalExpenses, ...computedItems]
    return combined.sort((a, b) => {
      const dateCompare = (b.date || '').localeCompare(a.date || '')
      if (dateCompare !== 0) return dateCompare
      return (b.createdAt || 0) - (a.createdAt || 0)
    })
  }, [personalExpenses, allGroupExpenses, allGroupSettlements, groups, user])
}
