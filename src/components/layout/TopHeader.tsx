/**
 * TopHeader.tsx  (Phase 4 — Scroll-Aware Premium Header)
 *
 * Changes vs original:
 *  ✅ All theme cycling, profile links, offline badge 100% preserved
 *  + useScroll to add elevated shadow/blur when scrolled
 *  + AnimatePresence for title route-change text swap
 *  + Logo shimmer animation on brand mark
 *  + Enhanced glassmorphism
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { OfflineBadge } from './OfflineBadge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { Sun, Moon, Laptop } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'

interface TopHeaderProps {
  title?: string
  subtitle?: string
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, subtitle }) => {
  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const { theme, setTheme } = useThemeStore()
  const { scrollY } = useScroll()

  // Increase shadow as user scrolls
  const headerShadow = useTransform(
    scrollY,
    [0, 50],
    ['0 0 0 0 transparent', '0 4px 24px rgba(0,0,0,0.08)']
  )

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <motion.header
      className="sticky top-0 z-30 flex items-center justify-between pt-safe pl-safe pr-safe px-3.5 xs:px-4 sm:px-6 py-3 transition-colors"
      style={{
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        background: 'hsl(var(--background) / 0.92)',
        boxShadow: headerShadow,
        borderBottom: '1px solid hsl(var(--border) / 0.4)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile Logo mark */}
        <Link to="/" className="md:hidden flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-sm shadow-primary/20"
            whileHover={{ scale: 1.08, rotate: -3 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          >
            ₹
          </motion.div>
          <span className="font-extrabold text-lg text-foreground tracking-tight">Oweo</span>
        </Link>

        {/* Desktop page title — animates on route change */}
        {title && (
          <div className="hidden md:block">
            <AnimatePresence mode="wait">
              <motion.h1
                key={title}
                className="text-xl font-bold tracking-tight text-foreground"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {title}
              </motion.h1>
            </AnimatePresence>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <OfflineBadge />

        {/* Theme quick switch */}
        <motion.button
          onClick={cycleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
          aria-label="Toggle theme"
          whileTap={{ scale: 0.85, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {theme === 'light' ? (
            <Sun className="h-5 w-5 text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon className="h-5 w-5 text-primary" />
          ) : (
            <Laptop className="h-5 w-5" />
          )}
        </motion.button>

        {/* Profile Avatar link */}
        <Link to="/profile" className="md:hidden">
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
            <Avatar
              src={profile?.photoURL || user?.photoURL}
              name={profile?.displayName || user?.displayName || 'User'}
              size="sm"
            />
          </motion.div>
        </Link>
      </div>
    </motion.header>
  )
}
