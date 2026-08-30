import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { AmountInput } from '@/components/ui/AmountInput'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToast } from '@/components/ui/Toast'
import { parseAmountInput, paiseToInputString, formatINR } from '@/domain/money/money'
import { ALL_CATEGORIES, CATEGORY_DEFINITIONS } from '@/domain/expenses/categories'
import { Target, Check, Sliders } from 'lucide-react'

export const BudgetSettings: React.FC = () => {
  const profile = useAuthStore((state) => state.profile)
  const updateMonthlyBudget = useAuthStore((state) => state.updateMonthlyBudget)
  const updateCategoryBudgets = useAuthStore((state) => state.updateCategoryBudgets)
  const { showToast } = useToast()

  const [budgetStr, setBudgetStr] = useState('')
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({})
  const [showCategoryBudgets, setShowCategoryBudgets] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile?.monthlyBudgetPaise) {
      setBudgetStr(paiseToInputString(profile.monthlyBudgetPaise))
    } else {
      setBudgetStr('')
    }

    if (profile?.categoryBudgetsPaise) {
      const initCat: Record<string, string> = {}
      Object.entries(profile.categoryBudgetsPaise).forEach(([cat, paise]) => {
        if (paise > 0) {
          initCat[cat] = (paise / 100).toString()
        }
      })
      setCategoryBudgets(initCat)
      if (Object.keys(initCat).length > 0) {
        setShowCategoryBudgets(true)
      }
    }
  }, [profile])

  const handleCategoryBudgetChange = (category: string, value: string) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const parsedOverallPaise = parseAmountInput(budgetStr) || 0
      await updateMonthlyBudget(parsedOverallPaise)

      const parsedCategoryBudgets: Record<string, number> = {}
      Object.entries(categoryBudgets).forEach(([cat, val]) => {
        const paise = parseAmountInput(val)
        if (paise && paise > 0) {
          parsedCategoryBudgets[cat] = paise
        }
      })

      await updateCategoryBudgets(parsedCategoryBudgets)

      showToast('Budget settings saved successfully!', 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to update budget', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const setPreset = (rupees: number) => {
    setBudgetStr(rupees.toString())
  }

  // Calculate sum of category budgets
  const totalCategoryPaise = Object.values(categoryBudgets).reduce((acc, val) => {
    const paise = parseAmountInput(val) || 0
    return acc + paise
  }, 0)

  return (
    <Card className="p-5 border-border/70 space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Target className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Monthly Spending Budget</h3>
          <p className="text-xs text-muted-foreground">
            Target spending limits and category allowances
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Overall Monthly Budget */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
            Overall Monthly Target
          </label>
          <AmountInput
            value={budgetStr}
            onChange={setBudgetStr}
            placeholder="0"
            showQuickChips={false}
          />

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[5000, 10000, 15000, 20000, 30000].map((amt) => (
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
        </div>

        {/* Toggle Category Budgets */}
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={() => setShowCategoryBudgets(!showCategoryBudgets)}
              className="flex items-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{showCategoryBudgets ? 'Hide Granular Category Budgets' : '+ Set Category Budgets (Food, Travel, etc.)'}</span>
            </button>
            {totalCategoryPaise > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                Allocated: <strong className="text-foreground">{formatINR(totalCategoryPaise)}</strong>
              </span>
            )}
          </div>

          {showCategoryBudgets && (
            <div className="space-y-3 pt-2 animate-fade-in bg-muted/20 p-3.5 rounded-2xl border border-border/70">
              <p className="text-xs text-muted-foreground">
                Set individual spending targets per category. Alerts will notify you when nearing 75% and 90% utilization.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto overscroll-contain pr-1">
                {ALL_CATEGORIES.map((cat) => {
                  const meta = CATEGORY_DEFINITIONS[cat]
                  const val = categoryBudgets[cat] || ''

                  return (
                    <div key={cat} className="flex items-center gap-2 bg-card p-2 rounded-xl border border-border/60">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                      >
                        ₹
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground truncate block">{cat}</span>
                      </div>
                      <div className="w-28">
                        <Input
                          placeholder="₹ Limit"
                          value={val}
                          onChange={(e) => handleCategoryBudgetChange(cat, e.target.value)}
                          className="h-8 text-xs font-semibold text-right"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Check className="h-4 w-4" />}
            className="w-full sm:w-auto font-bold shadow-md shadow-primary/20"
          >
            Save All Budgets
          </Button>
        </div>
      </form>
    </Card>
  )
}
