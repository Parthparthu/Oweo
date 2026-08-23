import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { parseAmountInput, paiseToInputString, formatINR } from '@/domain/money/money'
import { Target, Check } from 'lucide-react'

export const BudgetSettings: React.FC = () => {
  const profile = useAuthStore((state) => state.profile)
  const updateMonthlyBudget = useAuthStore((state) => state.updateMonthlyBudget)
  const { showToast } = useToast()

  const [budgetStr, setBudgetStr] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile?.monthlyBudgetPaise) {
      setBudgetStr(paiseToInputString(profile.monthlyBudgetPaise))
    } else {
      setBudgetStr('')
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const parsedPaise = parseAmountInput(budgetStr) || 0
      await updateMonthlyBudget(parsedPaise)
      showToast(
        parsedPaise > 0
          ? `Monthly budget set to ${formatINR(parsedPaise)}`
          : 'Budget cleared',
        'success'
      )
    } catch (err: any) {
      showToast(err?.message || 'Failed to update budget', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const setPreset = (rupees: number) => {
    setBudgetStr(rupees.toString())
  }

  return (
    <Card className="p-5 border-border/70 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Target className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Monthly Spending Budget</h3>
          <p className="text-xs text-muted-foreground">
            Target spending limit for understanding remaining allowance
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <AmountInput
          value={budgetStr}
          onChange={setBudgetStr}
          placeholder="0"
          showQuickChips={false}
        />

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[5000, 8000, 12000, 15000, 25000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setPreset(amt)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-muted hover:bg-primary/15 hover:text-primary transition-all text-foreground/80 border border-border/50"
            >
              ₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Check className="h-4 w-4" />}
          >
            Save Monthly Budget
          </Button>
        </div>
      </form>
    </Card>
  )
}
