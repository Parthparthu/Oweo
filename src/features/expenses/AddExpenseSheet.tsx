import React, { useState, useEffect } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import {
  CATEGORY_DEFINITIONS,
  ALL_EXPENSE_CATEGORIES,
  ALL_INCOME_CATEGORIES,
} from '@/domain/expenses/categories'
import { parseQuickExpenseInput } from '@/domain/expenses/heuristicParser'
import { parseAmountInput } from '@/domain/money/money'
import { toISODateString } from '@/utils/dateUtils'
import { TransactionCategory, PaymentMethod, TransactionType } from '@/types/expense'
import {
  Utensils,
  Car,
  ShoppingCart,
  Home,
  ShoppingBag,
  Film,
  Tv,
  Zap,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Gift,
  MoreHorizontal,
  Wand2,
  Calendar,
  SlidersHorizontal,
  Wallet,
  Briefcase,
  TrendingUp,
  RotateCcw,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react'
import { clsx } from 'clsx'

const ICONS: Record<string, React.ReactNode> = {
  Utensils: <Utensils className="h-4 w-4" />,
  Car: <Car className="h-4 w-4" />,
  ShoppingCart: <ShoppingCart className="h-4 w-4" />,
  Home: <Home className="h-4 w-4" />,
  ShoppingBag: <ShoppingBag className="h-4 w-4" />,
  Film: <Film className="h-4 w-4" />,
  Tv: <Tv className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  HeartPulse: <HeartPulse className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
  Wallet: <Wallet className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  RotateCcw: <RotateCcw className="h-4 w-4" />,
  MoreHorizontal: <MoreHorizontal className="h-4 w-4" />,
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Card', 'Cash', 'Net Banking']

export const AddExpenseSheet: React.FC = () => {
  const { isAddExpenseSheetOpen, closeAddExpenseSheet, createExpense, removeExpense } = useExpenseStore()
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()

  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE')
  const [quickInput, setQuickInput] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState<TransactionCategory>('Food')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(toISODateString())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [note, setNote] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset form on open - Default to Smart NLP Quick Entry
  useEffect(() => {
    if (isAddExpenseSheetOpen) {
      setTransactionType('EXPENSE')
      setQuickInput('')
      setAmountStr('')
      setCategory('Food')
      setTitle('')
      setDate(toISODateString())
      setPaymentMethod('UPI')
      setNote('')
      setShowAdvanced(false)
      setError('')
      setIsSubmitting(false)
    }
  }, [isAddExpenseSheetOpen])

  // Handle Quick text parsing in real-time
  const handleQuickInputChange = (text: string) => {
    setQuickInput(text)
    if (!text.trim()) {
      setAmountStr('')
      setTitle('')
      return
    }

    const parsed = parseQuickExpenseInput(text)
    if (parsed.amountPaise) {
      setAmountStr((parsed.amountPaise / 100).toString())
    }
    if (parsed.category && transactionType === 'EXPENSE') {
      setCategory(parsed.category)
    }
    if (parsed.title) {
      setTitle(parsed.title)
    }
  }

  const handleTransactionTypeChange = (type: TransactionType) => {
    setTransactionType(type)
    if (type === 'INCOME') {
      setCategory('Pocket Money')
    } else {
      setCategory('Food')
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isSubmitting) return

    // If user typed only in quickInput, make sure it's parsed
    let effectiveAmount = amountStr
    let effectiveCategory = category
    let effectiveTitle = title

    if (quickInput.trim()) {
      const parsed = parseQuickExpenseInput(quickInput)
      if (parsed.amountPaise && !amountStr) {
        effectiveAmount = (parsed.amountPaise / 100).toString()
      }
      if (parsed.category && transactionType === 'EXPENSE' && (!category || category === 'Food')) {
        effectiveCategory = parsed.category
      }
      if (parsed.title && !title) {
        effectiveTitle = parsed.title
      }
    }

    const parsedPaise = parseAmountInput(effectiveAmount)
    if (!parsedPaise || parsedPaise <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!user) {
      setError('You must be logged in')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const saved = await createExpense({
        userId: user.uid,
        type: transactionType,
        amountPaise: parsedPaise,
        category: effectiveCategory,
        title: effectiveTitle.trim() || effectiveCategory,
        date,
        paymentMethod,
        note: note.trim() || undefined,
      })

      showToast(
        `Added ₹${(parsedPaise / 100).toFixed(2)} for ${effectiveCategory}`,
        'success',
        4000,
        {
          label: 'Undo',
          onClick: async () => {
            await removeExpense(saved)
            showToast('Transaction removed', 'info')
          },
        }
      )
      closeAddExpenseSheet()
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedCategories = transactionType === 'INCOME' ? ALL_INCOME_CATEGORIES : ALL_EXPENSE_CATEGORIES

  return (
    <Sheet
      isOpen={isAddExpenseSheetOpen}
      onClose={closeAddExpenseSheet}
      title="Add Transaction"
      description="Record an income or expense"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Transaction Type Segmented Control */}
        <div className="flex bg-muted p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleTransactionTypeChange('EXPENSE')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all',
              transactionType === 'EXPENSE'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ArrowUpCircle className="h-4 w-4 text-destructive" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTransactionTypeChange('INCOME')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all',
              transactionType === 'INCOME'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
            Income
          </button>
        </div>

        {/* NLP Quick Input (Default Experience) */}
        {transactionType === 'EXPENSE' && (
          <div className="space-y-2.5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 rounded-2xl border border-primary/20">
            <label className="block text-xs font-extrabold text-primary uppercase tracking-wide flex items-center gap-1.5">
              <Wand2 className="h-3.5 w-3.5" />
              <span>Quick Natural Entry</span>
            </label>
            <Input
              value={quickInput}
              onChange={(e) => handleQuickInputChange(e.target.value)}
              placeholder="e.g. 250 Swiggy, 50 auto, 1200 groceries"
              autoFocus
              className="text-base font-semibold"
            />

            {/* Real-time Parsed Preview Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-1 min-h-[32px]">
              {amountStr ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-black text-xs shadow-sm">
                  ₹{amountStr}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground italic">Type amount and description above</span>
              )}
              {amountStr && (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border/80 font-bold text-xs text-foreground">
                    {category}
                  </span>
                  {title && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border/80 font-medium text-xs text-muted-foreground truncate max-w-[150px]">
                      "{title}"
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Quick Amount Keypad or Chips (if user wants to type or adjust amount directly) */}
        <AmountInput
          value={amountStr}
          onChange={(val) => {
            setAmountStr(val)
            if (error) setError('')
          }}
          showQuickChips={true}
          error={error}
        />

        {/* Categories Chip Grid */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
            Category
          </label>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1.5 xs:gap-2 max-h-40 overflow-y-auto overscroll-contain pr-1">
            {displayedCategories.map((catKey) => {
              const meta = CATEGORY_DEFINITIONS[catKey]
              const isSelected = category === catKey
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategory(catKey)}
                  className={clsx(
                    'flex items-center gap-1.5 xs:gap-2 p-2 xs:p-2.5 min-h-[38px] rounded-xl border text-xs font-semibold transition-all select-none text-left',
                    isSelected
                      ? transactionType === 'INCOME' 
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold scale-[1.02]' 
                          : 'bg-primary text-primary-foreground border-primary shadow-sm font-bold scale-[1.02]'
                      : 'bg-card text-foreground/90 border-border/60 hover:bg-muted/70'
                  )}
                >
                  <span className={clsx('shrink-0', isSelected ? 'text-white' : transactionType === 'INCOME' ? 'text-emerald-500' : 'text-primary')}>
                    {ICONS[meta?.icon] || <MoreHorizontal className="h-4 w-4" />}
                  </span>
                  <span className="truncate">{catKey}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Toggle Advanced Details (Date, Payment Method, Custom Description, Note) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{showAdvanced ? 'Hide Additional Details' : 'More Options (Date, Payment, Note)'}</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 pt-2 animate-fade-in border-t border-border/60">
            {/* Description & Date inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Description"
                placeholder={category}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
                Payment Method
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all select-none',
                      paymentMethod === pm
                        ? 'bg-foreground text-background border-foreground font-bold shadow-sm'
                        : 'bg-card text-muted-foreground border-border/60 hover:text-foreground'
                    )}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Note input */}
            <Input
              label="Note (Optional)"
              placeholder="Remarks or tags"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}

        {/* Save Action */}
        <div className="pt-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full justify-center text-sm font-bold shadow-md shadow-primary/25 h-12"
          >
            {transactionType === 'INCOME' ? 'Save Income' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
