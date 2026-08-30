import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDirectDebtStore } from '@/stores/useDirectDebtStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { parseAmountInput } from '@/domain/money/money'
import { toISODateString } from '@/utils/dateUtils'
import { DirectDebtType } from '@/types/directDebt'
import { ArrowDownLeft, ArrowUpRight, User, Calendar } from 'lucide-react'
import { clsx } from 'clsx'

export const AddDirectDebtModal: React.FC = () => {
  const { isAddDirectDebtModalOpen, closeAddDirectDebtModal, addDebt, removeDebt } = useDirectDebtStore()
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()

  const [otherUserName, setOtherUserName] = useState('')
  const [debtType, setDebtType] = useState<DirectDebtType>('you_paid')
  const [amountStr, setAmountStr] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(toISODateString())
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setOtherUserName('')
    setAmountStr('')
    setTitle('')
    setDate(toISODateString())
    setNote('')
    setError('')
    closeAddDirectDebtModal()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!otherUserName.trim()) {
      setError("Please enter the person's name")
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
      const created = await addDebt({
        creatorId: user.uid,
        otherUserName: otherUserName.trim(),
        amountPaise: parsedPaise,
        type: debtType,
        title: title.trim() || (debtType === 'you_paid' ? 'Paid for friend' : 'Borrowed from friend'),
        date,
        note: note.trim() || undefined,
      })

      showToast(
        debtType === 'you_paid'
          ? `${otherUserName.trim()} owes you ₹${(parsedPaise / 100).toFixed(2)}`
          : `You owe ${otherUserName.trim()} ₹${(parsedPaise / 100).toFixed(2)}`,
        'success',
        4000,
        {
          label: 'Undo',
          onClick: async () => {
            await removeDebt(created.id)
            showToast('1:1 Debt removed', 'info')
          },
        }
      )

      handleClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to record debt')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      isOpen={isAddDirectDebtModalOpen}
      onClose={handleClose}
      title="Record 1:1 Debt"
      description="Quickly track money between two people without creating a group"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Person Name Input */}
        <Input
          label="Person Name"
          placeholder="e.g. Rahul, Priya, Alex"
          value={otherUserName}
          onChange={(e) => setOtherUserName(e.target.value)}
          leftIcon={<User className="h-4 w-4" />}
          autoFocus
          required
        />

        {/* Direction Toggle: They owe me vs I owe them */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
            Who Paid?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDebtType('you_paid')}
              className={clsx(
                'flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all select-none',
                debtType === 'you_paid'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-card text-muted-foreground border-border/60 hover:bg-muted/70'
              )}
            >
              <ArrowDownLeft className="h-4 w-4 shrink-0" />
              <span>They owe me</span>
            </button>

            <button
              type="button"
              onClick={() => setDebtType('they_paid')}
              className={clsx(
                'flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all select-none',
                debtType === 'they_paid'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-sm'
                  : 'bg-card text-muted-foreground border-border/60 hover:bg-muted/70'
              )}
            >
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              <span>I owe them</span>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <AmountInput
          value={amountStr}
          onChange={(val) => {
            setAmountStr(val)
            if (error) setError('')
          }}
          error={error}
          showQuickChips={true}
        />

        {/* Description & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="For what?"
            placeholder="e.g. Lunch, Auto fare, Movie"
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

        {/* Note */}
        <Input
          label="Note (Optional)"
          placeholder="Remarks"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full justify-center font-bold h-12 shadow-md shadow-primary/25"
          >
            Save 1:1 Debt
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
