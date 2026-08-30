import React, { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { Avatar } from '@/components/ui/Avatar'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { ALL_CATEGORIES } from '@/domain/expenses/categories'
import {
  calculateEqualSplit,
  validateCustomSplit,
  calculatePercentageSplit,
} from '@/domain/splits/splitCalculator'
import { parseAmountInput, formatINR } from '@/domain/money/money'
import {
  convertForeignToPaise,
  getExchangeRateToINR,
} from '@/domain/currency/currencyConverter'
import { CurrencyCode, SUPPORTED_CURRENCIES, ALL_CURRENCY_CODES } from '@/types/currency'
import { ReceiptScannerModal } from '@/features/expenses/ReceiptScannerModal'
import { toISODateString } from '@/utils/dateUtils'
import { ExpenseCategory, SplitType, ParticipantShare } from '@/types/expense'
import { Check, Receipt, Globe, Sliders } from 'lucide-react'
import { clsx } from 'clsx'

export const AddGroupExpenseModal: React.FC = () => {
  const {
    isAddGroupExpenseModalOpen,
    closeAddGroupExpenseModal,
    activeGroup,
    activeGroupMembers,
    createGroupExpense,
  } = useGroupStore()
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()

  const [amountStr, setAmountStr] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('INR')
  const [exchangeRate, setExchangeRate] = useState<number>(1)
  const [showExchangeRateEdit, setShowExchangeRateEdit] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Food')
  const [payerId, setPayerId] = useState<string>('')
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [percentages, setPercentages] = useState<Record<string, string>>({})
  const [date, setDate] = useState(toISODateString())
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isAddGroupExpenseModalOpen && activeGroupMembers.length > 0) {
      setAmountStr('')
      setCurrency('INR')
      setExchangeRate(1)
      setShowExchangeRateEdit(false)
      setTitle('')
      setCategory('Food')
      setPayerId(user?.uid || activeGroupMembers[0].userId)
      setSplitType('equal')
      const allIds = activeGroupMembers.map((m) => m.userId)
      setSelectedMemberIds(allIds)
      setCustomAmounts({})
      setPercentages({})
      setDate(toISODateString())
      setNote('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isAddGroupExpenseModalOpen, activeGroupMembers, user])

  // Handle currency selection change
  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency)
    const rate = getExchangeRateToINR(newCurrency)
    setExchangeRate(rate)
  }

  const toggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      if (selectedMemberIds.length === 1) {
        setError('At least one participant must be selected')
        return
      }
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId))
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId])
    }
  }

  const selectAllMembers = () => {
    setSelectedMemberIds(activeGroupMembers.map((m) => m.userId))
  }

  // Calculate base currency INR total
  const rawInputNumber = parseFloat(amountStr) || 0
  const effectiveTotalPaise =
    currency === 'INR'
      ? parseAmountInput(amountStr) || 0
      : convertForeignToPaise(rawInputNumber, exchangeRate)

  const handleApplyItemizedSplit = (params: {
    totalPaise: number
    title: string
    shares: Record<string, number>
  }) => {
    setAmountStr((params.totalPaise / 100).toString())
    setCurrency('INR')
    setExchangeRate(1)
    setTitle(params.title)
    setSplitType('exact')

    const newCustom: Record<string, string> = {}
    Object.entries(params.shares).forEach(([uid, paise]) => {
      newCustom[uid] = (paise / 100).toString()
    })
    setCustomAmounts(newCustom)
    setSelectedMemberIds(Object.keys(params.shares))
    showToast('Applied itemized receipt claims to split shares!', 'success')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !activeGroup) return

    if (!effectiveTotalPaise || effectiveTotalPaise <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    if (!title.trim()) {
      setError('Please enter an expense title/description')
      return
    }

    if (selectedMemberIds.length === 0) {
      setError('Please select at least one participant')
      return
    }

    const payer = activeGroupMembers.find((m) => m.userId === payerId)
    if (!payer) {
      setError('Invalid payer selected')
      return
    }

    let calculatedShares: Record<string, number> = {}

    // Calculate participant shares based on split type (always in base INR paise)
    if (splitType === 'equal') {
      calculatedShares = calculateEqualSplit(effectiveTotalPaise, selectedMemberIds)
    } else if (splitType === 'exact') {
      const sharesPaise: Record<string, number> = {}
      selectedMemberIds.forEach((id) => {
        const val = parseFloat(customAmounts[id] || '0') || 0
        const paise = currency === 'INR' ? Math.round(val * 100) : convertForeignToPaise(val, exchangeRate)
        sharesPaise[id] = paise
      })
      const valid = validateCustomSplit(effectiveTotalPaise, sharesPaise)
      if (!valid.isValid) {
        setError(valid.errorMessage || 'Custom split amounts do not sum to total')
        return
      }
      calculatedShares = valid.shares
    } else if (splitType === 'percentage') {
      const pctMap: Record<string, number> = {}
      selectedMemberIds.forEach((id) => {
        pctMap[id] = parseFloat(percentages[id] || '0') || 0
      })
      const valid = calculatePercentageSplit(effectiveTotalPaise, pctMap)
      if (!valid.isValid) {
        setError(valid.errorMessage || 'Percentages must sum to 100%')
        return
      }
      calculatedShares = valid.shares
    }

    // Build participants dictionary with snapshots
    const participants: Record<string, ParticipantShare> = {}
    selectedMemberIds.forEach((id) => {
      const mem = activeGroupMembers.find((m) => m.userId === id)
      participants[id] = {
        userId: id,
        displayNameSnapshot: mem?.displayName || 'Member',
        photoURLSnapshot: mem?.photoURL,
        amountPaise: calculatedShares[id] || 0,
        percentage:
          splitType === 'percentage'
            ? parseFloat(percentages[id] || '0')
            : (calculatedShares[id] / effectiveTotalPaise) * 100,
      }
    })

    setIsSubmitting(true)
    setError('')

    try {
      await createGroupExpense(activeGroup.id, {
        payerId: payer.userId,
        payerSnapshot: {
          displayName: payer.displayName,
          photoURL: payer.photoURL,
        },
        amountPaise: effectiveTotalPaise,
        originalCurrency: currency !== 'INR' ? currency : undefined,
        originalAmount: currency !== 'INR' ? rawInputNumber : undefined,
        exchangeRate: currency !== 'INR' ? exchangeRate : undefined,
        title: title.trim(),
        category,
        date,
        note: note.trim() || undefined,
        splitType,
        participants,
      })

      showToast(`Added ${formatINR(effectiveTotalPaise)} to ${activeGroup.name}`, 'success')
      closeAddGroupExpenseModal()
    } catch (err: any) {
      setError(err?.message || 'Failed to add group expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog
        isOpen={isAddGroupExpenseModalOpen}
        onClose={closeAddGroupExpenseModal}
        title="Add Group Expense"
        description={`Split a transaction in ${activeGroup?.name || 'Group'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 pr-0.5">
          {/* Quick Itemize / OCR Scanner Action Bar */}
          <div className="flex items-center justify-between pb-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsScannerOpen(true)}
              leftIcon={<Receipt className="h-4 w-4 text-primary" />}
              className="text-xs font-bold border-primary/30 bg-primary/[0.04] hover:bg-primary/10"
            >
              Scan Receipt / Itemize Bill
            </Button>

            {/* Currency Selector */}
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                className="h-8 px-2 rounded-lg text-xs font-extrabold border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                {ALL_CURRENCY_CODES.map((c) => (
                  <option key={c} value={c}>
                    {SUPPORTED_CURRENCIES[c].symbol} {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <AmountInput
              value={amountStr}
              onChange={(val) => {
                setAmountStr(val)
                if (error) setError('')
              }}
              autoFocus
              error={error}
            />

            {/* Foreign Currency Conversion Preview & Exchange Rate Setting */}
            {currency !== 'INR' && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                <div>
                  <span className="text-muted-foreground font-medium">Base Equivalent: </span>
                  <strong className="text-foreground font-black">
                    {formatINR(effectiveTotalPaise)}
                  </strong>{' '}
                  <span className="text-[11px] text-muted-foreground">
                    (@ ₹{exchangeRate.toFixed(2)}/{currency})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExchangeRateEdit(!showExchangeRateEdit)}
                  className="text-primary font-bold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Sliders className="h-3 w-3" />
                  <span>{showExchangeRateEdit ? 'Hide Rate' : 'Edit Rate'}</span>
                </button>
              </div>
            )}

            {showExchangeRateEdit && currency !== 'INR' && (
              <div className="p-2.5 rounded-xl bg-card border border-border/70 text-xs space-y-1.5 animate-fade-in">
                <label className="block text-[11px] font-bold text-foreground">
                  Exchange Rate (1 {currency} = ₹ INR)
                </label>
                <input
                  type="number"
                  step="any"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                  className="h-8 w-full px-2 rounded-lg border border-input bg-background text-xs font-bold text-foreground"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Expense Title"
              placeholder="e.g. Dinner, Fuel, Grocery run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
          </div>

          {/* Payer Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
              Paid By
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeGroupMembers.map((member) => {
                const isSelected = payerId === member.userId
                const isCurrentUser = member.userId === user?.uid
                return (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => setPayerId(member.userId)}
                    className={clsx(
                      'flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all select-none min-h-[40px]',
                      isSelected
                        ? 'bg-primary/15 text-primary border-primary font-bold shadow-sm'
                        : 'bg-card text-foreground border-border/70 hover:bg-muted/70'
                    )}
                  >
                    <Avatar src={member.photoURL} name={member.displayName} size="xs" />
                    <span className="truncate">
                      {isCurrentUser ? 'You' : member.displayName}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Split Type Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
              Split Method
            </label>
            <Tabs
              tabs={[
                { id: 'equal', label: 'Equally' },
                { id: 'exact', label: 'Custom Amounts' },
                { id: 'percentage', label: 'By Percentage' },
              ]}
              activeTab={splitType}
              onChange={(tab) => setSplitType(tab as SplitType)}
            />
          </div>

          {/* Participants Selection & Custom Inputs */}
          <div className="space-y-2 pt-1 bg-muted/40 p-3 xs:p-3.5 rounded-2xl border border-border/70">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>SPLIT AMONG ({selectedMemberIds.length} SELECTED)</span>
              <button
                type="button"
                onClick={selectAllMembers}
                className="text-primary hover:underline"
              >
                Select All
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto overscroll-contain pr-0.5">
              {activeGroupMembers.map((member) => {
                const isSelected = selectedMemberIds.includes(member.userId)
                const equalSharePaise = isSelected
                  ? Math.floor(effectiveTotalPaise / selectedMemberIds.length)
                  : 0

                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 text-xs min-h-[42px]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMember(member.userId)}
                      className="flex items-center gap-2 flex-1 text-left min-w-0 mr-2"
                    >
                      <div
                        className={clsx(
                          'w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/40 bg-transparent'
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <Avatar src={member.photoURL} name={member.displayName} size="xs" />
                      <span className="font-semibold text-foreground truncate">
                        {member.userId === user?.uid ? 'You' : member.displayName}
                      </span>
                    </button>

                    {/* Split Type Specific Input per user */}
                    {isSelected && (
                      <div className="shrink-0">
                        {splitType === 'equal' && (
                          <span className="font-bold text-foreground tabular-nums">
                            {formatINR(equalSharePaise)}
                          </span>
                        )}

                        {splitType === 'exact' && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-primary">
                              {SUPPORTED_CURRENCIES[currency].symbol}
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={customAmounts[member.userId] || ''}
                              onChange={(e) =>
                                setCustomAmounts({
                                  ...customAmounts,
                                  [member.userId]: e.target.value,
                                })
                              }
                              className="w-20 xs:w-24 px-2 py-1 text-right text-xs font-bold rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                            />
                          </div>
                        )}

                        {splitType === 'percentage' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={percentages[member.userId] || ''}
                              onChange={(e) =>
                                setPercentages({
                                  ...percentages,
                                  [member.userId]: e.target.value,
                                })
                              }
                              className="w-16 xs:w-20 px-2 py-1 text-right text-xs font-bold rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                            />
                            <span className="text-xs font-bold text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Note (Optional)"
              placeholder="Add remarks or bill tags"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={closeAddGroupExpenseModal}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="font-bold shadow-md shadow-primary/20 flex-1 sm:flex-initial"
            >
              Add Shared Expense
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Mount Receipt Scanner Modal */}
      {activeGroup && (
        <ReceiptScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          members={activeGroupMembers}
          onApplyItemizedSplit={handleApplyItemizedSplit}
        />
      )}
    </>
  )
}
