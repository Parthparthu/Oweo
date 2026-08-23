/**
 * LoadingScreen.tsx  (Phase 8 — Premium Preloader)
 *
 * Changes vs original:
 *  ✅ Message prop interface preserved
 *  + Multi-ring pulsing logo animation (Framer Motion)
 *  + Shimmer progress bar at bottom
 *  + Smooth entrance + message fade-in with delay
 */
import React from 'react'
import { motion } from 'framer-motion'

export const LoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Loading Oweo...',
}) => {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-background p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo stack with animated rings */}
      <div className="relative flex items-center justify-center">
        {/* Outer breathing ring */}
        <motion.div
          className="absolute rounded-3xl bg-primary/10"
          style={{ width: 72, height: 72 }}
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute rounded-3xl bg-primary/15"
          style={{ width: 64, height: 64 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.1, 0.6],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* Logo mark */}
        <motion.div
          className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/30 relative z-10"
          animate={{
            boxShadow: [
              '0 0 20px 0 hsl(173 80% 36% / 0.3)',
              '0 0 40px 8px hsl(173 80% 36% / 0.5)',
              '0 0 20px 0 hsl(173 80% 36% / 0.3)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ scale: 0.7, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          // Directly animate on mount
          style={{ scale: 1, opacity: 1 }}
        >
          ₹
        </motion.div>
      </div>

      {/* Message */}
      <motion.p
        className="mt-7 text-sm font-semibold text-muted-foreground"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {message}
      </motion.p>

      {/* Shimmer progress bar at bottom */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-0.5 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 0.4,
          }}
        />
      </motion.div>
    </motion.div>
  )
}
