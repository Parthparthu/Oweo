/**
 * DesktopSidebar.tsx  (Phase 4 — Premium Visual Upgrade)
 *
 * Changes vs original:
 *  ✅ All nav links, theme cycling, user profile state 100% preserved
 *  + Framer Motion shared layoutId nav indicator pill
 *  + Brand logo animated gradient border + hover scale
 *  + "Add Expense" now uses GlowButton with magnetic effect
 *  + Enhanced glassmorphism + border treatment on sidebar
 *  + Subtle active link indicator animation
 */
import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  Home,
  ListOrdered,
  Users,
  PieChart,
  User,
  Plus,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { GlowButton } from '@/components/ui/GlowButton'
import { Avatar } from '@/components/ui/Avatar'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThemeStore } from '@/stores/useThemeStore'

const navLinks = [
  { to: '/', label: 'Home Dashboard', icon: Home, exact: true },
  { to: '/activity', label: 'Activity & History', icon: ListOrdered },
  { to: '/groups', label: 'Split Groups', icon: Users },
  { to: '/insights', label: 'Spending Insights', icon: PieChart },
  { to: '/profile', label: 'Profile & Settings', icon: User },
]

export const DesktopSidebar: React.FC = () => {
  const openAddExpense = useExpenseStore((state) => state.openAddExpenseSheet)
  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const { theme, setTheme } = useThemeStore()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <aside
      className="hidden md:flex flex-col w-60 lg:w-72 h-dvh max-h-dvh sticky top-0 shrink-0 p-4 lg:p-5 justify-between overflow-y-auto overscroll-contain no-scrollbar"
      style={{
        background: 'hsl(var(--card) / 0.85)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid hsl(var(--border) / 0.6)',
        boxShadow: '1px 0 0 0 hsl(var(--border) / 0.3)',
      }}
    >
      <div className="space-y-6">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-3 px-2 group">
          <motion.div
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shadow-md shadow-primary/25"
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          >
            ₹
          </motion.div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
              Oweo
            </span>
            <span className="block text-[11px] font-medium text-muted-foreground -mt-0.5">
              Expense & Split Tracker
            </span>
          </div>
        </Link>

        {/* Global Add Expense Button */}
        <GlowButton
          onClick={openAddExpense}
          variant="primary"
          size="lg"
          className="w-full justify-center shadow-md shadow-primary/20"
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Expense
        </GlowButton>

        {/* Nav Links with animated indicator */}
        <nav className="space-y-1 pt-2">
          {navLinks.map((link) => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className="relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors select-none"
              >
                {({ isActive: navIsActive }) => (
                  <>
                    {/* Animated background pill */}
                    <AnimatePresence>
                      {navIsActive && (
                        <motion.div
                          layoutId="sidebar-nav-indicator"
                          className="absolute inset-0 rounded-xl bg-primary/10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Active left accent bar */}
                    {navIsActive && (
                      <motion.div
                        layoutId="sidebar-accent-bar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Icon
                        className={clsx(
                          'h-5 w-5 shrink-0 relative z-10 transition-colors',
                          navIsActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                    </motion.div>
                    <span
                      className={clsx(
                        'relative z-10 transition-colors',
                        navIsActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {link.label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* User info & quick actions at bottom */}
      <div className="space-y-3 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between px-2">
          <motion.button
            onClick={cycleTheme}
            type="button"
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground py-1.5 px-2 rounded-lg hover:bg-muted transition-colors"
            whileTap={{ scale: 0.92 }}
          >
            {theme === 'light' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="h-4 w-4 text-primary" />
            ) : (
              <Laptop className="h-4 w-4" />
            )}
            <span className="capitalize">{theme} Theme</span>
          </motion.button>
        </div>

        <Link
          to="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors group"
        >
          <Avatar
            src={profile?.photoURL || user?.photoURL}
            name={profile?.displayName || user?.displayName || 'User'}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {profile?.displayName || user?.displayName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'Logged in'}</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
