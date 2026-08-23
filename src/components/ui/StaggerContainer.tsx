/**
 * StaggerContainer.tsx
 * Framer Motion container that staggers entrance animations for child items.
 * Each direct child that is a motion.div (or wrapped in <StaggerItem>) will
 * slide up and fade in with configurable delays.
 *
 * Usage:
 *   <StaggerContainer>
 *     <StaggerItem><Card /></StaggerItem>
 *     <StaggerItem delay={1}><Card /></StaggerItem>
 *   </StaggerContainer>
 */
import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  /** Gap between each child animation (seconds). Default 0.07 */
  staggerDelay?: number
  /** Initial delay before the first child (seconds). Default 0 */
  initialDelay?: number
}

interface StaggerItemProps extends HTMLMotionProps<'div'> {
  /** Override the stagger index-based delay with a manual one (0-based index) */
  index?: number
}

const containerVariants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
    },
  }),
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: 'blur(2px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.07,
  initialDelay = 0,
  className,
  ...props
}) => {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      custom={staggerDelay}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: initialDelay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <motion.div
      className={className}
      variants={itemVariants}
      {...props}
    >
      {children}
    </motion.div>
  )
}
