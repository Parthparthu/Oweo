import React, { useEffect, useMemo } from 'react'
import { WalletBalanceCard } from '@/features/dashboard/WalletBalanceCard'
import { QuickActions } from '@/features/dashboard/QuickActions'
import { WhoOwesMeCard } from '@/features/dashboard/WhoOwesMeCard'
import { RecentExpensesList } from '@/features/dashboard/RecentExpensesList'
import { AddDirectDebtModal } from '@/features/settlements/AddDirectDebtModal'
import { useCombinedExpenses } from '@/hooks/useCombinedExpenses'
import { useGroupStore } from '@/stores/useGroupStore'
import { useDirectDebtStore } from '@/stores/useDirectDebtStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { deriveUserCrossGroupDebts } from '@/domain/settlements/settlementEngine'

export const HomePage: React.FC = () => {
  const combinedExpenses = useCombinedExpenses()
  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const groups = useGroupStore((state) => state.groups)
  const allGroupBalances = useGroupStore((state) => state.allGroupBalances)
  const directDebts = useDirectDebtStore((state) => state.directDebts)
  const subscribeDebts = useDirectDebtStore((state) => state.subscribeDebts)

  useEffect(() => {
    if (user) {
      const unsub = subscribeDebts(user.uid)
      return () => unsub()
    }
  }, [user, subscribeDebts])

  // Calculate live cross-group balances for the current user
  const debtSummary = useMemo(() => {
    if (!user) {
      return {
        owedToUser: [],
        userOwes: [],
        totalOwedToUserPaise: 0,
        totalUserOwesPaise: 0,
        netPositionPaise: 0,
      }
    }

    const groupData = groups.map((g) => {
      return {
        groupId: g.id,
        groupName: g.name,
        balances: allGroupBalances[g.id] || {},
      }
    })

    return deriveUserCrossGroupDebts(user.uid, groupData)
  }, [user, groups, allGroupBalances])

  return (
    <div className="space-y-6 pb-6">
      {/* Wallet Balance Hero */}
      <WalletBalanceCard
        walletBalancePaise={profile?.walletBalancePaise || 0}
      />

      {/* Quick Action Shortcuts */}
      <QuickActions />

      {/* Shared Debt Status (Groups + 1:1 Direct Debts) */}
      <WhoOwesMeCard
        owedToUser={debtSummary.owedToUser}
        userOwes={debtSummary.userOwes}
        totalOwedToUserPaise={debtSummary.totalOwedToUserPaise}
        totalUserOwesPaise={debtSummary.totalUserOwesPaise}
        directDebts={directDebts}
      />

      {/* Recent Unified Transactions */}
      <RecentExpensesList expenses={combinedExpenses} limit={6} />

      {/* 1:1 Debt Modal */}
      <AddDirectDebtModal />
    </div>
  )
}
