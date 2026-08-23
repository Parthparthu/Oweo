/**
 * AnimatedNumber.tsx
 * Spring-animated number display for financial amounts.
 * Uses Framer Motion's useSpring + useMotionValue + useTransform.
 * The number counts up from 0 to the target on mount.
 *
 * All formatting is delegated to the formatFn prop — defaults to formatINR.
 */
import React, { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { formatINR } from '@/domain/money/money'

interface AnimatedNumberProps {
  /** The target value in raw units (e.g., paise) */
  value: number
  /** Custom format function. Defaults to formatINR */
  formatFn?: (v: number) => string
  /** Additional className on the wrapper span */
  className?: string
  /** Spring stiffness. Default 60 */
  stiffness?: number
  /** Spring damping. Default 15 */
  damping?: number
  /** Delay before animation starts (ms). Default 0 */
  delay?: number
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  formatFn = formatINR,
  className,
  stiffness = 60,
  damping = 15,
  delay = 0,
}) => {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { stiffness, damping })

  // Round to nearest integer for display (paise is always integer)
  const displayValue = useTransform(springValue, (v) => formatFn(Math.round(v)))

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      motionValue.set(value)
      return
    }

    // Start from current value if it has already been set (live updates)
    const timer = setTimeout(() => {
      motionValue.set(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, motionValue, delay])

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  )
}
