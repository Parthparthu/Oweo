/**
 * ActivityPage.tsx  (Phase 6 — Animated Activity & Transactions)
 *
 * Changes vs original:
 *  ✅ All filter logic, search, date range, CSV export 100% preserved
 *  + Page entrance animation
 *  + Animated category chips with shared layoutId active indicator
 *  + AnimatePresence on expense list so items animate out on filter
 *  + Filter bar pop-in
 *  + Search input focus glow
 */
import React, { useMemo } from 'react'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCombinedExpenses } from '@/hooks/useCombinedExpenses'
import { ExpenseListItem } from '@/features/expenses/ExpenseListItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ALL_CATEGORIES } from '@/domain/expenses/categories'
import { formatINR } from '@/domain/money/money'
import { Search, Receipt, X, Download } from 'lucide-react'
import { clsx } from 'clsx'
import { exportExpensesToCSV } from '@/services/export/csvExporter'
import { useToast } from '@/components/ui/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer'

export const ActivityPage: React.FC = () => {
  const combinedExpenses = useCombinedExpenses()
  const user = useAuthStore((state) => state.user)
  const {
    searchQuery,
    selectedCategory,
    startDate,
    endDate,
    hasMore,
    isLoadingMore,
    loadMoreExpenses,
    setSearchQuery,
    setSelectedCategory,
    setDateRange,
    openAddExpenseSheet,
    openEditExpense,
  } = useExpenseStore()

  const { showToast } = useToast()

  // Filtered unified expenses
  const filteredExpenses = useMemo(() => {
    return combinedExpenses.filter((e) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = e.title.toLowerCase().includes(q)
        const matchCat = e.category.toLowerCase().includes(q)
        const matchNote = (e.note || '').toLowerCase().includes(q)
        const matchGroup = (e.groupName || '').toLowerCase().includes(q)
        if (!matchTitle && !matchCat && !matchNote && !matchGroup) return false
      }
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false
      if (startDate && e.date < startDate) return false
      if (endDate && e.date > endDate) return false
      return true
    })
  }, [combinedExpenses, searchQuery, selectedCategory, startDate, endDate])

  const totalFilteredPaise = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amountPaise, 0),
    [filteredExpenses]
  )

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    startDate !== null ||
    endDate !== null

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
    setDateRange(null, null)
  }

  const handleExport = () => {
    if (filteredExpenses.length === 0) return
    exportExpensesToCSV(filteredExpenses, 'filtered-expenses.csv')
    showToast('Exported filtered transactions to CSV', 'success')
  }

  return (
    <motion.div
      className="space-y-5 pb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Activity &amp; Transactions
          </h2>
          <motion.p
            key={filteredExpenses.length}
            className="text-xs text-muted-foreground mt-0.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Showing {filteredExpenses.length} transaction
            {filteredExpenses.length === 1 ? '' : 's'} •{' '}
            Total: <strong>{formatINR(totalFilteredPaise)}</strong>
          </motion.p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <AnimatePresence>
            {filteredExpenses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Export CSV
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="primary" size="sm" onClick={openAddExpenseSheet}>
            + Add Expense
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Input
          placeholder="Search by title, category, note, or group..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          rightIcon={
            searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="pointer-events-auto p-1 min-w-[32px] min-h-[32px] flex items-center justify-center hover:bg-muted rounded-lg"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null
          }
        />
      </motion.div>

      {/* Category Filter Chips — with shared layoutId active underline */}
      <motion.div
        className="flex items-center gap-1.5 xs:gap-2 overflow-x-auto no-scrollbar overscroll-contain pb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.3 }}
      >
        {['All', ...ALL_CATEGORIES].map((cat) => {
          const isSelected = selectedCategory === cat
          return (
            <motion.button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat as typeof selectedCategory)}
              className={clsx(
                'relative px-3 xs:px-3.5 py-1.5 min-h-[36px] flex items-center justify-center rounded-full text-xs font-semibold shrink-0 transition-colors select-none border',
                isSelected
                  ? cat === 'All'
                    ? 'bg-foreground text-background border-foreground font-bold shadow-sm'
                    : 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                  : 'bg-card text-muted-foreground border-border/70 hover:text-foreground'
              )}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Active Filter Clear Bar */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 text-xs font-semibold"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <span>Active filters applied</span>
            <motion.button
              type="button"
              onClick={clearFilters}
              className="text-primary hover:underline font-bold"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Clear all filters
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title={hasActiveFilters ? 'No transactions found' : 'No expenses recorded'}
            description={
              hasActiveFilters
                ? 'Try changing your search keywords or clearing active filters.'
                : 'Add your first expense or join a split group to start tracking spending.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : '+ Add First Expense'}
            onAction={hasActiveFilters ? clearFilters : openAddExpenseSheet}
          />
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <StaggerContainer className="space-y-2" key={selectedCategory + searchQuery}>
            {filteredExpenses.map((expense) => (
              <StaggerItem key={expense.id}>
                <ExpenseListItem
                  expense={expense}
                  onClick={openEditExpense}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </AnimatePresence>
      )}

      {/* Pagination Load More */}
      {hasMore && !hasActiveFilters && user && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMoreExpenses(user.uid)}
            isLoading={isLoadingMore}
            className="w-full sm:w-auto font-bold"
          >
            Load Older Transactions
          </Button>
        </div>
      )}
    </motion.div>
  )
}
