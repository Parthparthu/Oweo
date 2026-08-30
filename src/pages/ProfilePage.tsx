import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ThemeSettings } from '@/features/profile/ThemeSettings'
import { BudgetSettings } from '@/features/profile/BudgetSettings'
import { RecurringBillsSection } from '@/features/expenses/RecurringBillsSection'
import { ExportSection } from '@/features/profile/ExportSection'
import { AccountDeletionModal } from '@/features/profile/AccountDeletionModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { formatFriendlyDate } from '@/utils/dateUtils'
import { resetCurrentUserData } from '@/services/firebase/resetService'
import { LogOut, Trash2, RotateCcw } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const profile = useAuthStore((state) => state.profile)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { showToast } = useToast()

  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      showToast('Signed out successfully', 'info')
    } catch (err: any) {
      showToast(err?.message || 'Failed to sign out', 'error')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleResetData = async () => {
    if (!user) return
    const confirmed = window.confirm(
      'Are you sure you want to delete all your expenses, groups, and settlements to start fresh?'
    )
    if (!confirmed) return

    setIsResetting(true)
    try {
      await resetCurrentUserData(user.uid)
      showToast('All your test data has been wiped clean!', 'success')
      setTimeout(() => {
        window.location.href = import.meta.env.BASE_URL || '/'
      }, 1000)
    } catch (err: any) {
      showToast(err?.message || 'Failed to reset test data', 'error')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          Profile &amp; Settings
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your preferences, budget, and account
        </p>
      </div>

      {/* User Info Card */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-card via-card to-primary/5 border-border/80 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <Avatar
            src={profile?.photoURL || user?.photoURL}
            name={profile?.displayName || user?.displayName || 'User'}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground truncate">
              {profile?.displayName || user?.displayName || 'User'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-all">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 xs:gap-2 text-xs text-muted-foreground mt-2 font-medium">
              <span>Member since {formatFriendlyDate(profile?.createdAt || Date.now())}</span>
              <span>•</span>
              <span>Default Currency: ₹ INR</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            isLoading={isLoggingOut}
            onClick={handleLogout}
            className="shrink-0"
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Monthly Budget Settings */}
      <BudgetSettings />

      {/* Subscriptions & Recurring Bills */}
      <RecurringBillsSection />

      {/* Theme & Accent Settings */}
      <ThemeSettings />

      {/* Data Export & Statements */}
      <ExportSection />

      {/* Security & Danger Zone */}
      <Card className="p-5 border-destructive/20 bg-destructive/[0.02] space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
            <Trash2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">
              Wipe test records or permanently delete your account
            </p>
          </div>
        </div>

        <div className="pt-1 flex flex-col xs:flex-row gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            isLoading={isResetting}
            onClick={handleResetData}
            leftIcon={<RotateCcw className="h-4 w-4 text-amber-500" />}
            className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 justify-center"
          >
            Reset All Test Data
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
            className="justify-center"
          >
            Delete Account &amp; Data
          </Button>
        </div>
      </Card>

      {/* Mount Deletion Modal */}
      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  )
}
