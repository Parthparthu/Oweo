/**
 * MotionCard.tsx
 * Premium animated card built on top of the existing Card component.
 * Adds scroll-triggered reveal, hover lift, and optional glassmorphism.
 *
 * Drop-in replacement for <Card> — all Card props are forwarded.
 */
import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'
import { useIntersectionReveal } from '@/hooks/useIntersectionReveal'

export interface MotionCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'glass' | 'flat' | 'gradient'
  /** Delay the entrance animation (seconds). Default 0 */
  delay?: number
  /** Disable the scroll-triggered reveal (always visible). Default false */
  noReveal?: boolean
  /** Disable hover lift. Default false */
  noHover?: boolean
}

const variants = {
  default: 'bg-card text-card-foreground border border-border/70 shadow-card-premium',
  elevated: 'bg-card text-card-foreground border border-border/40 shadow-md shadow-black/5',
  glass: 'glass text-card-foreground shadow-glass',
  flat: 'bg-muted/50 text-foreground border-transparent',
  gradient: 'bg-gradient-mesh bg-card text-card-foreground border border-border/70 shadow-card-premium',
}

export const MotionCard: React.FC<MotionCardProps> = ({
  className,
  variant = 'default',
  delay = 0,
  noReveal = false,
  noHover = false,
  children,
  ...props
}) => {
  const { ref, isVisible } = useIntersectionReveal<HTMLDivElement>({
    threshold: 0.08,
    rootMargin: '0px 0px -20px 0px',
  })

  return (
    <motion.div
      ref={noReveal ? undefined : (ref as React.Ref<HTMLDivElement>)}
      className={twMerge(
        clsx(
          'rounded-2xl p-4 sm:p-5 transition-colors',
          variants[variant],
          className
        )
      )}
      initial={noReveal ? false : { opacity: 0, y: 18 }}
      animate={noReveal || isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        noHover
          ? undefined
          : {
              y: -3,
              boxShadow:
                '0 12px 32px -8px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
              transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
            }
      }
      {...props}
    >
      {children}
    </motion.div>
  )
}
