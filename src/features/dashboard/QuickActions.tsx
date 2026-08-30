/**
 * QuickActions.tsx  (1:1 Split + Group + Spend Shortcuts)
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, PieChart, Handshake } from 'lucide-react'
import { motion } from 'framer-motion'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useDirectDebtStore } from '@/stores/useDirectDebtStore'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'

interface ActionCardProps {
  onClick?: () => void
  href?: string
  iconClass: string
  icon: React.ReactNode
  title: string
  desc: string
}

const ActionCard: React.FC<ActionCardProps> = ({ onClick, href, iconClass, icon, title, desc }) => {
  const content = (
    <motion.div
      className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/70 hover:border-primary/50 transition-colors text-left select-none w-full cursor-pointer relative overflow-hidden"
      whileHover={{
        y: -3,
        boxShadow: '0 8px 24px -6px rgba(0,0,0,0.10)',
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      {/* Hover shimmer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0, x: '-100%' }}
        whileHover={{ opacity: 1, x: '200%' }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        }}
      />

      <motion.div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}
        whileHover={{ scale: 1.15, rotate: -8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {icon}
      </motion.div>
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </motion.div>
  )

  if (href) {
    return <Link to={href} className="block">{content}</Link>
  }
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {content}
    </button>
  )
}

export const QuickActions: React.FC = () => {
  const openAddExpense = useExpenseStore((state) => state.openAddExpenseSheet)
  const openCreateGroup = useGroupStore((state) => state.openCreateGroupModal)
  const openAddDirectDebt = useDirectDebtStore((state) => state.openAddDirectDebtModal)

  return (
    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      <StaggerItem>
        <ActionCard
          onClick={openAddExpense}
          iconClass="bg-primary/10 text-primary"
          icon={<Plus className="h-5 w-5" />}
          title="Add Expense"
          desc="Log personal spend"
        />
      </StaggerItem>
      <StaggerItem>
        <ActionCard
          onClick={openAddDirectDebt}
          iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          icon={<Handshake className="h-5 w-5" />}
          title="1:1 Split"
          desc="Split without group"
        />
      </StaggerItem>
      <StaggerItem>
        <ActionCard
          onClick={openCreateGroup}
          iconClass="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
          icon={<Users className="h-5 w-5" />}
          title="New Group"
          desc="Trips & Flatmates"
        />
      </StaggerItem>
      <StaggerItem>
        <ActionCard
          href="/insights"
          iconClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          icon={<PieChart className="h-5 w-5" />}
          title="Insights"
          desc="Spending breakdown"
        />
      </StaggerItem>
    </StaggerContainer>
  )
}
