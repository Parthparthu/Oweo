/**
 * ExpenseListItem.tsx  (Phase 6 â€” Interactive List Item)
 *
 * Changes vs original:
 *  âœ… All navigation, category icons, formatINR, onClick 100% preserved
 *  + motion.div with whileHover lift + border color transition
 *  + Category icon container spring scale on hover
 *  + whileTap scale press feedback
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PersonalTransaction } from '@/types/expense'
import { CATEGORY_DEFINITIONS } from '@/domain/expenses/categories'
import { formatINR } from '@/domain/money/money'
import { formatFriendlyDate } from '@/utils/dateUtils'
import {
  Utensils,
  Car,
  ShoppingCart,
  Home,
  ShoppingBag,
  Film,
  Tv,
  Zap,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Gift,
  Handshake,
  MoreHorizontal,
  Users,
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

const ICONS: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="h-4 w-4" />,
  Car: <Car className="h-4 w-4" />,
  ShoppingCart: <ShoppingCart className="h-4 w-4" />,
  Home: <Home className="h-4 w-4" />,
  ShoppingBag: <ShoppingBag className="h-4 w-4" />,
  Film: <Film className="h-4 w-4" />,
  Tv: <Tv className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  HeartPulse: <HeartPulse className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
  Handshake: <Handshake className="h-4 w-4" />,
  MoreHorizontal: <MoreHorizontal className="h-4 w-4" />,
}

interface Props {
  expense: PersonalTransaction
  onClick?: (expense: PersonalTransaction) => void
}

export const ExpenseListItem: React.FC<Props> = ({ expense, onClick }) => {
  const navigate = useNavigate()
  const meta = CATEGORY_DEFINITIONS[expense.category] || CATEGORY_DEFINITIONS.Other
  const isIncome = expense.type === 'INCOME' || expense.amountPaise < 0

  const handleClick = () => {
    if (expense.isGroupExpense && expense.groupId) {
      navigate(`/groups/${expense.groupId}`)
    } else if (onClick) {
      onClick(expense)
    }
  }

  return (
    <motion.div
      onClick={handleClick}
      className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/70 hover:border-primary/45 transition-colors cursor-pointer"
      whileHover={{
        y: -1,
        boxShadow: '0 4px 16px -4px rgba(0,0,0,0.08)',
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      }}
      whileTap={{ scale: 0.988 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      layout
    >
      <div className="flex items-center gap-2.5 xs:gap-3 min-w-0 flex-1 mr-2">
        <motion.div
          className="w-10 h-10 xs:w-11 xs:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{
            backgroundColor: isIncome ? '#10b98115' : `${meta.color}15`,
            color: isIncome ? '#10b981' : meta.color,
          }}
          whileHover={{ scale: 1.12, rotate: -6 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {ICONS[meta.icon] || <MoreHorizontal className="h-5 w-5" />}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 xs:gap-2">
            <h4 className="text-xs xs:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {expense.title || expense.category}
            </h4>
            {expense.isGroupExpense && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                <Users className="h-2.5 w-2.5" />
                <span className="max-w-[70px] xs:max-w-[100px] truncate">{expense.groupName || 'Group'}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2 text-[11px] xs:text-xs text-muted-foreground mt-0.5 truncate">
            <span>{isIncome ? (expense.category === 'Settlement' ? 'Reimbursement' : expense.category) : expense.category}</span>
            <span>•</span>
            <span>{formatFriendlyDate(expense.date)}</span>
            {expense.paymentMethod && !expense.isGroupExpense && (
              <>
                <span>•</span>
                <span className="font-medium text-foreground/70">{expense.paymentMethod}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 pl-1">
        <span
          className={clsx(
            'text-xs xs:text-sm sm:text-base font-black tabular-nums',
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
          )}
        >
          {isIncome
            ? `+ ${formatINR(Math.abs(expense.amountPaise))}`
            : formatINR(expense.amountPaise)}
        </span>
        {expense.note && (
          <p className="text-[10px] text-muted-foreground truncate max-w-[100px] xs:max-w-[140px]">
            {expense.note}
          </p>
        )}
      </div>
    </motion.div>
  )
}
