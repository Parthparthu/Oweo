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
  ALL_CATEGORIES,
} from '@/domain/expenses/categories'
import { parseQuickExpenseInput } from '@/domain/expenses/heuristicParser'
import { parseAmountInput } from '@/domain/money/money'
import { toISODateString } from '@/utils/dateUtils'
import { ExpenseCategory, PaymentMethod } from '@/types/expense'
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
  MoreHorizontal: <MoreHorizontal className="h-4 w-4" />,
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Card', 'Cash', 'Net Banking']

export const AddExpenseSheet: React.FC = () => {
  const { isAddExpenseSheetOpen, closeAddExpenseSheet, createExpense } = useExpenseStore()
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()

  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Food')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(toISODateString())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [note, setNote] = useState('')
  const [quickInput, setQuickInput] = useState('')
  const [isQuickMode, setIsQuickMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset form on open
  useEffect(() => {
    if (isAddExpenseSheetOpen) {
      setAmountStr('')
      setCategory('Food')
      setTitle('')
      setDate(toISODateString())
      setPaymentMethod('UPI')
      setNote('')
      setQuickInput('')
      setIsQuickMode(false)
      setError('')
      setIsSubmitting(false)
    }
  }, [isAddExpenseSheetOpen])

  // Handle Quick text parsing on the fly
  const handleQuickInputChange = (text: string) => {
    setQuickInput(text)
    if (!text.trim()) return

    const parsed = parseQuickExpenseInput(text)
    if (parsed.amountPaise) {
      setAmountStr((parsed.amountPaise / 100).toString())
    }
    if (parsed.category) {
      setCategory(parsed.category)
    }
    if (parsed.title) {
      setTitle(parsed.title)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isSubmitting) return

    const parsedPaise = parseAmountInput(amountStr)
    if (!parsedPaise || parsedPaise <= 0) {
      setError('Please enter a valid amount greater than ₹0')
      return
    }

    if (!user) {
      setError('You must be logged in')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await createExpense({
        userId: user.uid,
        amountPaise: parsedPaise,
        category,
        title: title.trim() || category,
        date,
        paymentMethod,
        note: note.trim() || undefined,
      })

      showToast(`Added ₹${(parsedPaise / 100).toFixed(2)} for ${category}`, 'success')
      closeAddExpenseSheet()
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      isOpen={isAddExpenseSheetOpen}
      onClose={closeAddExpenseSheet}
      title="Add Expense"
      description="Record a personal spending transaction"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Toggle Mode: Keypad vs Quick Text */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => setIsQuickMode(!isQuickMode)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>{isQuickMode ? 'Switch to Standard Keypad' : 'Quick Text Entry (e.g. 180 dinner)'}</span>
          </button>
        </div>

        {/* Quick Text Input Mode */}
        {isQuickMode ? (
          <div className="space-y-3 bg-muted/40 p-3.5 rounded-2xl border border-border/70 animate-fade-in">
            <Input
              value={quickInput}
              onChange={(e) => handleQuickInputChange(e.target.value)}
              placeholder="e.g. 180 dinner, 50 auto, 1200 groceries"
              autoFocus
              leftIcon={<Wand2 className="h-4 w-4 text-primary" />}
            />
            {amountStr && (
              <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
                <span>
                  Detected: <strong className="text-foreground">₹{amountStr}</strong> for{' '}
                  <strong className="text-foreground">{category}</strong>
                </span>
                <span className="text-primary font-bold">{title}</span>
              </div>
            )}
          </div>
        ) : (
          /* Standard Big Numeric Amount Input */
          <AmountInput
            value={amountStr}
            onChange={(val) => {
              setAmountStr(val)
              if (error) setError('')
            }}
            autoFocus
            error={error}
          />
        )}

        {/* Categories Chip Grid */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
            Category
          </label>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1.5 xs:gap-2 max-h-44 overflow-y-auto overscroll-contain pr-1">
            {ALL_CATEGORIES.map((catKey) => {
              const meta = CATEGORY_DEFINITIONS[catKey]
              const isSelected = category === catKey
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategory(catKey)}
                  className={clsx(
                    'flex items-center gap-1.5 xs:gap-2 p-2 xs:p-2.5 min-h-[40px] rounded-xl border text-xs font-semibold transition-all select-none text-left',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm font-bold scale-[1.02]'
                      : 'bg-card text-foreground/90 border-border/60 hover:bg-muted/70'
                  )}
                >
                  <span className={clsx('shrink-0', isSelected ? 'text-primary-foreground' : 'text-primary')}>
                    {ICONS[meta.icon] || <MoreHorizontal className="h-4 w-4" />}
                  </span>
                  <span className="truncate">{catKey}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Description & Note inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Input
            label="Description (Optional)"
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
        <div className="space-y-1.5 pt-1">
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
          placeholder="Add tags, location or remarks"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Save Action */}
        <div className="pt-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full justify-center text-sm font-bold shadow-md shadow-primary/25 h-12"
          >
            Save Expense
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
