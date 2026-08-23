/**
 * BottomNav.tsx  (Phase 4 — Premium Mobile Navigation)
 *
 * Changes vs original:
 *  ✅ All nav links, openAddExpense action 100% preserved
 *  + Framer Motion layoutId shared pill for active tab indicator
 *  + FAB (+) button with scale spring + glow ring
 *  + Tab icons with whileTap micro-feedback
 *  + Enhanced glassmorphism
 *  + Active tab label animates up on selection
 */
import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, ListOrdered, Plus, Users, PieChart } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useExpenseStore } from '@/stores/useExpenseStore'

const navItems = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/activity', label: 'Activity', icon: ListOrdered },
  { isAction: true },
  { to: '/groups', label: 'Groups', icon: Users },
  { to: '/insights', label: 'Insights', icon: PieChart },
] as const

export const BottomNav: React.FC = () => {
  const openAddExpense = useExpenseStore((state) => state.openAddExpenseSheet)
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe pl-safe pr-safe md:hidden"
      style={{
        background: 'hsl(var(--card) / 0.88)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderTop: '1px solid hsl(var(--border) / 0.6)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-1 xs:px-2 relative">
        {navItems.map((item) => {
          if ('isAction' in item && item.isAction) {
            return (
              <div key="action-plus" className="flex items-center justify-center -mt-5">
                <motion.button
                  type="button"
                  onClick={openAddExpense}
                  className="w-13 h-13 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background"
                  aria-label="Add Expense"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: 52,
                    height: 52,
                    boxShadow: '0 4px 16px hsl(var(--primary) / 0.4), 0 0 0 0 hsl(var(--primary) / 0)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 4px 16px hsl(var(--primary) / 0.4)',
                      '0 4px 24px hsl(var(--primary) / 0.6)',
                      '0 4px 16px hsl(var(--primary) / 0.4)',
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: 'easeInOut',
                  }}
                >
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </motion.button>
              </div>
            )
          }

          const navItem = item as { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }
          const Icon = navItem.icon
          const isActive = navItem.exact
            ? location.pathname === navItem.to
            : location.pathname.startsWith(navItem.to)

          return (
            <NavLink
              key={navItem.to}
              to={navItem.to}
              end={navItem.exact}
              className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 select-none relative"
            >
              {() => (
                <>
                  {/* Animated active background dot */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="bottom-tab-indicator"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      />
                    )}
                  </AnimatePresence>

                  <motion.div
                    whileTap={{ scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Icon
                      className={clsx(
                        'h-5 w-5 transition-colors duration-200',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </motion.div>

                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isActive ? 'active' : 'inactive'}
                      className={clsx(
                        'text-[11px] font-semibold transition-colors duration-200',
                        isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                      )}
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {navItem.label}
                    </motion.span>
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
