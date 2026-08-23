/**
 * RecentExpensesList.tsx  (Phase 5 — Staggered List)
 *
 * Changes vs original:
 *  ✅ All expense data, editing callbacks 100% preserved
 *  + StaggerContainer for staggered item entrance
 *  + "View All" link gets arrow animation on hover
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { PersonalExpense } from '@/types/expense'
import { ExpenseListItem } from '@/features/expenses/ExpenseListItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { Receipt, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'

interface Props {
  expenses: PersonalExpense[]
  limit?: number
}

export const RecentExpensesList: React.FC<Props> = ({ expenses, limit = 5 }) => {
  const openAddExpense = useExpenseStore((state) => state.openAddExpenseSheet)
  const openEditExpense = useExpenseStore((state) => state.openEditExpense)

  const recent = expenses.slice(0, limit)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          Recent Expenses
        </h3>
        {expenses.length > limit && (
          <motion.div whileHover={{ x: 2 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
            <Link
              to="/activity"
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span>View All ({expenses.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        )}
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="No expenses recorded yet"
          description="Record your first chai, dinner, or travel spend to get instant insights."
          actionLabel="+ Add First Expense"
          onAction={openAddExpense}
        />
      ) : (
        <StaggerContainer className="space-y-2">
          {recent.map((expense) => (
            <StaggerItem key={expense.id}>
              <ExpenseListItem
                expense={expense}
                onClick={openEditExpense}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  )
}
