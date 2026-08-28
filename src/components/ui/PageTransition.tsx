/**
 * PageTransition.tsx
 * Smooth route enter transition for child routes without AnimatePresence blocking.
 */
import React from 'react'
import { motion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  /** Unique key per route — triggers the enter animation */
  locationKey: string
}

export const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, locationKey }, ref) => {
    return (
      <motion.div
        key={locationKey}
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.22,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    )
  }
)
PageTransition.displayName = 'PageTransition'
