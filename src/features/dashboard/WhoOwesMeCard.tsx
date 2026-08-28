/**
 * WhoOwesMeCard.tsx  (Phase 5 — Animated Debt Cards)
 *
 * Changes vs original:
 *  ✅ All debt calculation, display, formatINR, Links 100% preserved
 *  + MotionCard with scroll-triggered reveal
 *  + AnimatedNumber for owed/owes totals
 *  + Staggered debt list items
 */
import React from 'react'
import { MotionCard } from '@/components/ui/MotionCard'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { formatINR } from '@/domain/money/money'
import { UserDebtSummary } from '@/types/settlement'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface Props {
  owedToUser: UserDebtSummary[]
  userOwes: UserDebtSummary[]
  totalOwedToUserPaise: number
  totalUserOwesPaise: number
}

const debtItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
}

export const WhoOwesMeCard: React.FC<Props> = ({
  owedToUser,
  userOwes,
  totalOwedToUserPaise,
  totalUserOwesPaise,
}) => {
  const hasDebts = owedToUser.length > 0 || userOwes.length > 0

  if (!hasDebts) {
    return (
      <MotionCard className="p-5 border-border/70" delay={0.05}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Split Balances</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All settled up! You do not owe or have pending shared debts.
            </p>
          </div>
          <Link to="/groups">
            <Button variant="outline" size="sm">
              View Groups
            </Button>
          </Link>
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
                  value={totalOwedToUserPaise}
                  stiffness={70}
                  damping={16}
                  delay={200}
                />
              </p>
            </div>
          </div>
          <Link to="/groups" className="text-xs font-bold text-primary hover:underline">
            Details →
          </Link>
        </div>

        {owedToUser.length > 0 ? (
          <div className="space-y-2 pt-1">
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
        ) : (
          <p className="text-xs text-muted-foreground">No one owes you right now.</p>
        )}
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
                  value={totalUserOwesPaise}
                  stiffness={70}
                  damping={16}
                  delay={300}
                />
              </p>
            </div>
          </div>
          <Link to="/groups" className="text-xs font-bold text-primary hover:underline">
            Details →
          </Link>
        </div>

        {userOwes.length > 0 ? (
          <div className="space-y-2 pt-1">
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
        ) : (
          <p className="text-xs text-muted-foreground">You do not owe anyone.</p>
        )}
      </MotionCard>
    </div>
  )
}
