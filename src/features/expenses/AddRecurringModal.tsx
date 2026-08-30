import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRecurringStore } from '@/stores/useRecurringStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { ALL_CATEGORIES } from '@/domain/expenses/categories'
import { parseAmountInput } from '@/domain/money/money'
import { TransactionCategory, PaymentMethod } from '@/types/expense'
import { RecurringFrequency } from '@/types/recurring'

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Card', 'Cash', 'Net Banking']

export const AddRecurringModal: React.FC = () => {
  const { isAddModalOpen, closeAddModal, addRecurring } = useRecurringStore()
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()

  const [title, setTitle] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState<TransactionCategory>('Subscriptions')
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [billingDay, setBillingDay] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setTitle('')
    setAmountStr('')
    setCategory('Subscriptions')
    setFrequency('monthly')
    setBillingDay(1)
    setError('')
    closeAddModal()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!title.trim()) {
      setError('Please enter a name for this bill or subscription')
      return
    }

    const parsedPaise = parseAmountInput(amountStr)
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
      const now = new Date()
      let dueMonth = now.getMonth()
      let dueYear = now.getFullYear()

      if (now.getDate() > billingDay) {
        dueMonth += 1
        if (dueMonth > 11) {
          dueMonth = 0
          dueYear += 1
        }
      }

      const nextDueDate = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(billingDay).padStart(2, '0')}`

      await addRecurring({
        userId: user.uid,
        title: title.trim(),
        amountPaise: parsedPaise,
        category,
        frequency,
        billingDay: Math.max(1, Math.min(31, billingDay)),
        nextDueDate,
        isActive: true,
        paymentMethod,
      })

      showToast(`Added ${title.trim()} to recurring bills!`, 'success')
      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to add recurring bill')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      isOpen={isAddModalOpen}
      onClose={handleClose}
      title="Add Subscription / Recurring Bill"
      description="Track monthly rent, Netflix, gym, or broadband bills"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Input
          label="Bill / Subscription Name"
          placeholder="e.g. Netflix, House Rent, Spotify, Gym"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <AmountInput
          value={amountStr}
          onChange={(val) => {
            setAmountStr(val)
            if (error) setError('')
          }}
          error={error}
          showQuickChips={true}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
              Billing Day of Month
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={31}
                value={billingDay}
                onChange={(e) => setBillingDay(parseInt(e.target.value) || 1)}
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                {billingDay === 1
                  ? '1st'
                  : billingDay === 2
                  ? '2nd'
                  : billingDay === 3
                  ? '3rd'
                  : `${billingDay}th`}
              </span>
            </div>
          </div>
        </div>

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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  paymentMethod === pm
                    ? 'bg-foreground text-background border-foreground font-bold shadow-sm'
                    : 'bg-card text-muted-foreground border-border/60 hover:text-foreground'
                }`}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full justify-center font-bold h-12 shadow-md shadow-primary/25"
          >
            Save Recurring Bill
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
