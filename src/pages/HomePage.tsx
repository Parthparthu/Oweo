import React, { useMemo } from 'react'
import { PersonalSpendingSummary } from '@/features/dashboard/PersonalSpendingSummary'
import { QuickActions } from '@/features/dashboard/QuickActions'
import { WhoOwesMeCard } from '@/features/dashboard/WhoOwesMeCard'
import { RecentExpensesList } from '@/features/dashboard/RecentExpensesList'
import { useCombinedExpenses } from '@/hooks/useCombinedExpenses'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { deriveUserCrossGroupDebts } from '@/domain/settlements/settlementEngine'
import { useNavigate } from 'react-router-dom'

export const HomePage: React.FC = () => {
  const combinedExpenses = useCombinedExpenses()
  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const groups = useGroupStore((state) => state.groups)
  const allGroupBalances = useGroupStore((state) => state.allGroupBalances)
  const navigate = useNavigate()

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
      {/* Personal Spending Hero (Unified Personal + Group Share) */}
      <PersonalSpendingSummary
        expenses={combinedExpenses}
        monthlyBudgetPaise={profile?.monthlyBudgetPaise || 0}
        onSetBudgetClick={() => navigate('/profile')}
      />

      {/* Quick Action Shortcuts */}
      <QuickActions />

      {/* Shared Debt Status */}
      <WhoOwesMeCard
        owedToUser={debtSummary.owedToUser}
        userOwes={debtSummary.userOwes}
        totalOwedToUserPaise={debtSummary.totalOwedToUserPaise}
        totalUserOwesPaise={debtSummary.totalUserOwesPaise}
      />

      {/* Recent Unified Transactions */}
      <RecentExpensesList expenses={combinedExpenses} limit={6} />
    </div>
  )
}
