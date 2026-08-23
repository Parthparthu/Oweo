/**
 * PageTransition.tsx
 * Wraps route content in Framer Motion AnimatePresence for smooth
 * page-level enter / exit transitions. Applied once in AppShell.
 *
 * Usage:
 *   <PageTransition locationKey={location.pathname}>
 *     <Outlet />
 *   </PageTransition>
 */
import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  /** Unique key per route — triggers the enter/exit animation */
  locationKey: string
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: 'blur(2px)',
    transition: {
      duration: 0.16,
      ease: 'easeIn',
    },
  },
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  locationKey,
}) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={locationKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ willChange: 'opacity, transform, filter' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
