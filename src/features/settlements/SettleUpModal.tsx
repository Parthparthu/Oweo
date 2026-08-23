import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { parseAmountInput, formatINR } from '@/domain/money/money'
import { toISODateString } from '@/utils/dateUtils'
import { ProposedSettlement } from '@/types/settlement'
import { ArrowRight, CheckCircle2, Handshake, Sparkles } from 'lucide-react'

export const SettleUpModal: React.FC = () => {
  const {
    isSettleUpModalOpen,
    closeSettleUpModal,
    activeGroup,
    activeGroupMembers,
    activeGroupProposedSettlements,
    createGroupSettlement,
  } = useGroupStore()
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToast()

  const [isCustomMode, setIsCustomMode] = useState(false)
  const [payerId, setPayerId] = useState<string>('')
  const [receiverId, setReceiverId] = useState<string>('')
  const [amountStr, setAmountStr] = useState('')
  const [date, setDate] = useState(toISODateString())
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleQuickSettle = async (prop: ProposedSettlement) => {
    if (!activeGroup || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createGroupSettlement(activeGroup.id, {
        payerId: prop.fromUserId,
        receiverId: prop.toUserId,
        payerSnapshot: {
          displayName: prop.fromName,
          photoURL: prop.fromPhoto,
        },
        receiverSnapshot: {
          displayName: prop.toName,
          photoURL: prop.toPhoto,
        },
        amountPaise: prop.amountPaise,
        date: toISODateString(),
        note: 'Settled proposed balance',
      })

      showToast(`Settlement of ${formatINR(prop.amountPaise)} recorded!`, 'success')
      closeSettleUpModal()
    } catch (err: any) {
      showToast(err?.message || 'Failed to record settlement', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCustomSettle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeGroup || isSubmitting) return

    const parsedPaise = parseAmountInput(amountStr)
    if (!parsedPaise || parsedPaise <= 0) {
      setError('Please enter a valid settlement amount')
      return
    }

    if (!payerId || !receiverId) {
      setError('Please select both payer and receiver')
      return
    }

    if (payerId === receiverId) {
      setError('Payer and receiver cannot be the same person')
      return
    }

    const payer = activeGroupMembers.find((m) => m.userId === payerId)
    const receiver = activeGroupMembers.find((m) => m.userId === receiverId)

    if (!payer || !receiver) {
      setError('Invalid members selected')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await createGroupSettlement(activeGroup.id, {
        payerId: payer.userId,
        receiverId: receiver.userId,
        payerSnapshot: {
          displayName: payer.displayName,
          photoURL: payer.photoURL,
        },
        receiverSnapshot: {
          displayName: receiver.displayName,
          photoURL: receiver.photoURL,
        },
        amountPaise: parsedPaise,
        date,
        note: note.trim() || undefined,
      })

      showToast(`Settlement of ${formatINR(parsedPaise)} recorded!`, 'success')
      closeSettleUpModal()
    } catch (err: any) {
      setError(err?.message || 'Failed to record settlement')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      isOpen={isSettleUpModalOpen}
      onClose={closeSettleUpModal}
      title="Settle Balances"
      description={`Record a debt settlement in ${activeGroup?.name || 'Group'}`}
    >
      <div className="space-y-4 pt-1">
        {/* Toggle Mode */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            {isCustomMode ? 'Custom Payment Entry' : 'Smart Simplified Settlements'}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(!isCustomMode)
              setError('')
            }}
            className="text-xs font-bold text-primary hover:underline"
          >
            {isCustomMode ? 'View Proposed Settle-ups' : '+ Record Custom Settlement'}
          </button>
        </div>

        {!isCustomMode ? (
          /* Proposed Settle-Ups List */
          <div className="space-y-3">
            {activeGroupProposedSettlements.length === 0 ? (
              <div className="text-center py-8 space-y-2 bg-muted/30 rounded-2xl border border-dashed border-border/70">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-foreground">All Settled Up!</h4>
                <p className="text-xs text-muted-foreground">
                  No outstanding debts exist in this group right now.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Minimal transfers calculated to settle all group debts</span>
                </div>
                {activeGroupProposedSettlements.map((prop, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 p-3 rounded-2xl bg-card border border-border/70 shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Avatar src={prop.fromPhoto} name={prop.fromName} size="xs" />
                      <span className="text-xs font-bold text-foreground truncate">
                        {prop.fromUserId === user?.uid ? 'You' : prop.fromName}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Avatar src={prop.toPhoto} name={prop.toName} size="xs" />
                      <span className="text-xs font-bold text-foreground truncate">
                        {prop.toUserId === user?.uid ? 'You' : prop.toName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between xs:justify-end gap-2.5 shrink-0 pt-1 xs:pt-0 border-t xs:border-t-0 border-border/40">
                      <span className="text-xs xs:text-sm font-black text-foreground tabular-nums">
                        {formatINR(prop.amountPaise)}
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={isSubmitting}
                        onClick={() => handleQuickSettle(prop)}
                      >
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Custom Settlement Form */
          <form onSubmit={handleCustomSettle} className="space-y-4">
            <AmountInput
              value={amountStr}
              onChange={(val) => {
                setAmountStr(val)
                if (error) setError('')
              }}
              autoFocus
              error={error}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
                  Payer (Paid)
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select Payer</option>
                  {activeGroupMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userId === user?.uid ? 'You' : m.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
                  Receiver (Received)
                </label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select Receiver</option>
                  {activeGroupMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userId === user?.uid ? 'You' : m.displayName}
                    </option>
                  ))}
                </select>
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
                label="Note"
                placeholder="UPI / Cash settlement"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomMode(false)}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<Handshake className="h-4 w-4" />}
                className="flex-1 sm:flex-initial"
              >
                Record Settlement
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  )
}
