/**
 * AppShell.tsx  (Phase 4 — Page Transitions + Preserved Data Logic)
 *
 * Changes vs original:
 *  ✅ All Firestore subscriptions, online/offline tracking 100% preserved
 *  + PageTransition wrapper keyed on pathname for smooth route changes
 */
import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DesktopSidebar } from './DesktopSidebar'
import { BottomNav } from './BottomNav'
import { TopHeader } from './TopHeader'
import { AddExpenseSheet } from '@/features/expenses/AddExpenseSheet'
import { EditExpenseModal } from '@/features/expenses/EditExpenseModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { CreateGroupModal } from '@/features/groups/CreateGroupModal'
import { PageTransition } from '@/components/ui/PageTransition'

export const AppShell: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const setOnlineStatus = useAuthStore((state) => state.setOnlineStatus)
  const subscribeExpenses = useExpenseStore((state) => state.subscribeExpenses)
  const subscribeGroups = useGroupStore((state) => state.subscribeGroups)
  const location = useLocation()

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])

  // Subscribe to real-time expenses and groups when logged in
  useEffect(() => {
    if (!user) return

    const unsubExpenses = subscribeExpenses(user.uid)
    const unsubGroups = subscribeGroups(user.uid)

    return () => {
      unsubExpenses()
      unsubGroups()
    }
  }, [user, subscribeExpenses, subscribeGroups])

  // Get current page title for top header
  const getHeaderTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Home'
    if (path === '/activity') return 'Activity'
    if (path.startsWith('/groups')) return 'Split Groups'
    if (path === '/insights') return 'Spending Insights'
    if (path === '/profile') return 'Profile & Settings'
    return undefined
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-dvh pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        <TopHeader title={getHeaderTitle()} />
        <main className="flex-1 max-w-5xl w-full mx-auto p-3.5 xs:p-4 sm:p-6 lg:p-8">
          {/* Page-level enter/exit transition keyed by route */}
          <PageTransition locationKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Add / Edit Expense Sheets */}
      <AddExpenseSheet />
      <EditExpenseModal />
      <CreateGroupModal />
    </div>
  )
}
