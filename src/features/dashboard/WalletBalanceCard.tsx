import React from 'react'

import { MotionCard } from '@/components/ui/MotionCard'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

import { Wallet } from 'lucide-react'

interface Props {
  walletBalancePaise: number
}

export const WalletBalanceCard: React.FC<Props> = ({ walletBalancePaise }) => {
  return (
    <MotionCard
      variant="gradient"
      noReveal
      noHover
      className="p-5 sm:p-6 relative overflow-hidden"
    >
      {/* Subtle top-right glow orb */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="flex flex-col relative">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
            Available Balance
          </span>
        </div>
        
        <div className="flex items-baseline gap-2 mt-1">
          <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            <AnimatedNumber
              value={walletBalancePaise}
              stiffness={55}
              damping={14}
              delay={100}
            />
          </h2>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 font-medium max-w-sm">
          This balance automatically updates when you record income, spend money, or settle group debts.
        </p>
      </div>
    </MotionCard>
  )
}
