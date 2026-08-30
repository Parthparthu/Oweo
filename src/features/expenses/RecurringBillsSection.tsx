import React, { useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRecurringStore } from '@/stores/useRecurringStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { formatINR } from '@/domain/money/money'
import { CATEGORY_DEFINITIONS } from '@/domain/expenses/categories'
import { AddRecurringModal } from './AddRecurringModal'
import {
  Repeat,
  Plus,
  Trash2,
  Sparkles,
  Check,
  X,
  Calendar,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const RecurringBillsSection: React.FC = () => {
  const {
    recurringExpenses,
    detectedPatterns,
    openAddModal,
    subscribe,
    toggleActive,
    removeRecurring,
    scanForPatterns,
    acceptPattern,
    dismissPattern,
  } = useRecurringStore()

  const expenses = useExpenseStore((state) => state.expenses)
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()

  // Subscribe to recurring expenses
  useEffect(() => {
    if (user) {
      const unsub = subscribe(user.uid)
      return () => unsub()
    }
  }, [user, subscribe])

  // Scan for recurring payment patterns when expenses change
  useEffect(() => {
    if (expenses.length >= 2) {
      scanForPatterns(expenses)
    }
  }, [expenses, scanForPatterns])

  const handleAcceptPattern = async (pattern: typeof detectedPatterns[0]) => {
    if (!user) return
    try {
      await acceptPattern(pattern, user.uid)
      showToast(`Tracked ${pattern.title} as recurring bill!`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to track pattern', 'error')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    try {
      await removeRecurring(id)
      showToast(`Removed ${title}`, 'info')
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete recurring bill', 'error')
    }
  }

  const totalMonthlyCommitmentPaise = recurringExpenses
    .filter((r) => r.isActive)
    .reduce((acc, r) => acc + r.amountPaise, 0)

  return (
    <Card className="p-5 border-border/70 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Repeat className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Subscriptions &amp; Recurring Bills
            </h3>
            <p className="text-xs text-muted-foreground">
              Monthly rent, utilities, streaming, and memberships
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          Add Bill
        </Button>
      </div>

      {/* Monthly Commitment Header */}
      {recurringExpenses.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 text-xs">
          <span className="font-semibold text-muted-foreground">Total Monthly Fixed Bills</span>
          <span className="font-extrabold text-foreground tabular-nums text-sm">
            {formatINR(totalMonthlyCommitmentPaise)}/mo
          </span>
        </div>
      )}

      {/* Smart Suggestions Banner (Pattern Detection) */}
      <AnimatePresence>
        {detectedPatterns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Detected Recurring Payment Patterns</span>
            </div>

            {detectedPatterns.slice(0, 2).map((pattern, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground truncate">{pattern.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    ~{formatINR(pattern.amountPaise)}/mo around the {pattern.suggestedBillingDay}th ({pattern.occurrences} past transactions)
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    className="h-7 px-2.5 text-[11px] font-bold"
                    onClick={() => handleAcceptPattern(pattern)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Track
                  </Button>
                  <button
                    type="button"
                    onClick={() => dismissPattern(pattern.title, pattern.amountPaise)}
                    className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                    title="Dismiss suggestion"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscriptions List */}
      {recurringExpenses.length === 0 && detectedPatterns.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/70 space-y-1">
          <p className="font-semibold text-foreground">No recurring bills tracked yet</p>
          <p>Add rent, Netflix, gym, or broadband to keep tabs on monthly fixed commitments.</p>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {recurringExpenses.map((rec) => {
            const meta = CATEGORY_DEFINITIONS[rec.category]

            return (
              <div
                key={rec.id}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition-all ${
                  rec.isActive
                    ? 'bg-card border-border/70 shadow-sm'
                    : 'bg-muted/30 border-border/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                    style={{
                      backgroundColor: `${meta?.color || '#6366f1'}15`,
                      color: meta?.color || '#6366f1',
                    }}
                  >
                    ₹
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="font-bold text-foreground truncate">{rec.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Every month on {rec.billingDay}th</span>
                      {rec.paymentMethod && <span>• {rec.paymentMethod}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-extrabold text-foreground tabular-nums text-sm">
                    {formatINR(rec.amountPaise)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleActive(rec.id, !rec.isActive)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      rec.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {rec.isActive ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rec.id, rec.title)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete recurring bill"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <AddRecurringModal />
    </Card>
  )
}
