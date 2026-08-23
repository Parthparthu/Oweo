import React, { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useToast } from '@/components/ui/Toast'
import { ALL_CATEGORIES } from '@/domain/expenses/categories'
import { parseAmountInput, paiseToInputString } from '@/domain/money/money'
import { ExpenseCategory, PaymentMethod } from '@/types/expense'
import { Trash2 } from 'lucide-react'

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Card', 'Cash', 'Net Banking']

export const EditExpenseModal: React.FC = () => {
  const { editingExpense, closeEditExpense, updateExpense, removeExpense } = useExpenseStore()
  const { showToast } = useToast()

  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Food')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingExpense) {
      setAmountStr(paiseToInputString(editingExpense.amountPaise))
      setCategory(editingExpense.category)
      setTitle(editingExpense.title)
      setDate(editingExpense.date)
      setPaymentMethod(editingExpense.paymentMethod || 'UPI')
      setNote(editingExpense.note || '')
      setShowDeleteConfirm(false)
      setError('')
    }
  }, [editingExpense])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense || isSubmitting) return

    const parsedPaise = parseAmountInput(amountStr)
    if (!parsedPaise || parsedPaise <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await updateExpense(editingExpense.id, {
        amountPaise: parsedPaise,
        category,
        title: title.trim() || category,
        date,
        paymentMethod,
        note: note.trim() || undefined,
      })
      showToast('Expense updated', 'success')
      closeEditExpense()
    } catch (err: any) {
      setError(err?.message || 'Failed to update expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingExpense || isDeleting) return
    setIsDeleting(true)
    try {
      await removeExpense(editingExpense.id)
      showToast('Expense deleted', 'info')
      closeEditExpense()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete expense')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!editingExpense) return null

  return (
    <Dialog
      isOpen={Boolean(editingExpense)}
      onClose={closeEditExpense}
      title="Edit Expense"
    >
      {showDeleteConfirm ? (
        <div className="space-y-4 py-2">
          <p className="text-sm text-foreground">
            Are you sure you want to permanently delete this expense?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-4">
          <AmountInput
            value={amountStr}
            onChange={(val) => {
              setAmountStr(val)
              if (error) setError('')
            }}
            error={error}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Description"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pt-3 gap-2 xs:gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={closeEditExpense}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  )
}
