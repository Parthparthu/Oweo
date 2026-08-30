/**
 * WhoOwesMeCard.tsx  (Unified Group Debts + 1:1 Direct Debts with 1-Tap Settle & Undo)
 */
import React from 'react'
import { MotionCard } from '@/components/ui/MotionCard'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { formatINR } from '@/domain/money/money'
import { UserDebtSummary } from '@/types/settlement'
import { DirectDebt } from '@/types/directDebt'
import { useDirectDebtStore } from '@/stores/useDirectDebtStore'
import { useToast } from '@/components/ui/Toast'
import { ArrowDownLeft, ArrowUpRight, Check, Handshake, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface Props {
  owedToUser: UserDebtSummary[]
  userOwes: UserDebtSummary[]
  totalOwedToUserPaise: number
  totalUserOwesPaise: number
  directDebts?: DirectDebt[]
}

const debtItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  }),
}

export const WhoOwesMeCard: React.FC<Props> = ({
  owedToUser,
  userOwes,
  totalOwedToUserPaise,
  totalUserOwesPaise,
  directDebts = [],
}) => {
  const { markSettled, unMarkSettled, openAddDirectDebtModal } = useDirectDebtStore()
  const { showToast } = useToast()

  // Filter unsettled 1:1 direct debts
  const unsettledDirectDebts = directDebts.filter((d) => !d.isSettled)
  const directOwedToUser = unsettledDirectDebts.filter((d) => d.type === 'you_paid')
  const directUserOwes = unsettledDirectDebts.filter((d) => d.type === 'they_paid')

  const directTotalOwedPaise = directOwedToUser.reduce((acc, d) => acc + d.amountPaise, 0)
  const directTotalUserOwesPaise = directUserOwes.reduce((acc, d) => acc + d.amountPaise, 0)

  const combinedTotalOwed = totalOwedToUserPaise + directTotalOwedPaise
  const combinedTotalUserOwes = totalUserOwesPaise + directTotalUserOwesPaise

  const hasDebts =
    owedToUser.length > 0 ||
    userOwes.length > 0 ||
    directOwedToUser.length > 0 ||
    directUserOwes.length > 0

  const handleSettleDirectDebt = async (debt: DirectDebt) => {
    try {
      await markSettled(debt.id)
      showToast(`Settled ₹${(debt.amountPaise / 100).toFixed(2)} with ${debt.otherUserName}`, 'success', 5000, {
        label: 'Undo',
        onClick: async () => {
          await unMarkSettled(debt.id)
          showToast('Settlement undone', 'info')
        },
      })
    } catch (err: any) {
      showToast(err?.message || 'Failed to settle debt', 'error')
    }
  }

  if (!hasDebts) {
    return (
      <MotionCard className="p-5 border-border/70" delay={0.05}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Split Balances</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All settled up! No pending shared or 1:1 debts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openAddDirectDebtModal} leftIcon={<Handshake className="h-3.5 w-3.5" />}>
              + 1:1 Split
            </Button>
            <Link to="/groups">
              <Button variant="secondary" size="sm">
                Groups
              </Button>
            </Link>
          </div>
        </div>
      </MotionCard>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Owed to you card */}
      <MotionCard
        className="p-5 border-emerald-500/20 bg-emerald-500/[0.03] space-y-3"
        delay={0.05}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">You are owed</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber
                  value={combinedTotalOwed}
                  stiffness={70}
                  damping={16}
                  delay={200}
                />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddDirectDebtModal}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>1:1</span>
            </button>
            <Link to="/groups" className="text-xs font-bold text-primary hover:underline">
              Groups →
            </Link>
          </div>
        </div>

        {/* 1:1 direct debts owed to user */}
        {directOwedToUser.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {directOwedToUser.map((debt, idx) => (
              <motion.div
                key={debt.id}
                custom={idx}
                variants={debtItemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between p-2 rounded-xl bg-card border border-emerald-500/30 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <Avatar name={debt.otherUserName} size="xs" />
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-foreground truncate">{debt.otherUserName}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5 truncate">
                      ({debt.title})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatINR(debt.amountPaise)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => handleSettleDirectDebt(debt)}
                    title="Mark Settled"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Settle
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Group debts owed to user */}
        {owedToUser.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            {owedToUser.slice(0, 3).map((item, idx) => (
              <motion.div
                key={item.userId + (item.groupId || '') + idx}
                custom={idx}
                variants={debtItemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <Avatar src={item.photoURL} name={item.displayName} size="xs" />
                  <span className="font-semibold text-foreground truncate">{item.displayName}</span>
                  {item.groupName && (
                    <span className="text-[10px] text-muted-foreground truncate shrink-0">
                      ({item.groupName})
                    </span>
                  )}
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                  +{formatINR(item.amountPaise)}
                </span>
              </motion.div>
            ))}
          </div>
        ) : directOwedToUser.length === 0 ? (
          <p className="text-xs text-muted-foreground">No one owes you right now.</p>
        ) : null}
      </MotionCard>

      {/* You owe card */}
      <MotionCard
        className="p-5 border-rose-500/20 bg-rose-500/[0.03] space-y-3"
        delay={0.1}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">You owe</span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                <AnimatedNumber
                  value={combinedTotalUserOwes}
                  stiffness={70}
                  damping={16}
                  delay={300}
                />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddDirectDebtModal}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>1:1</span>
            </button>
            <Link to="/groups" className="text-xs font-bold text-primary hover:underline">
              Groups →
            </Link>
          </div>
        </div>

        {/* 1:1 direct debts user owes */}
        {directUserOwes.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {directUserOwes.map((debt, idx) => (
              <motion.div
                key={debt.id}
                custom={idx}
                variants={debtItemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between p-2 rounded-xl bg-card border border-rose-500/30 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <Avatar name={debt.otherUserName} size="xs" />
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-foreground truncate">{debt.otherUserName}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5 truncate">
                      ({debt.title})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">
                    -{formatINR(debt.amountPaise)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px] border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                    onClick={() => handleSettleDirectDebt(debt)}
                    title="Mark Settled"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Settle
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Group debts user owes */}
        {userOwes.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            {userOwes.slice(0, 3).map((item, idx) => (
              <motion.div
                key={item.userId + (item.groupId || '') + idx}
                custom={idx}
                variants={debtItemVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <Avatar src={item.photoURL} name={item.displayName} size="xs" />
                  <span className="font-semibold text-foreground truncate">{item.displayName}</span>
                  {item.groupName && (
                    <span className="text-[10px] text-muted-foreground truncate shrink-0">
                      ({item.groupName})
                    </span>
                  )}
                </div>
                <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0 tabular-nums">
                  -{formatINR(item.amountPaise)}
                </span>
              </motion.div>
            ))}
          </div>
        ) : directUserOwes.length === 0 ? (
          <p className="text-xs text-muted-foreground">You do not owe anyone.</p>
        ) : null}
      </MotionCard>
    </div>
  )
}
