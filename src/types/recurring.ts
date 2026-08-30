import { ExpenseCategory, PaymentMethod } from './expense'

export type RecurringFrequency = 'monthly' | 'yearly' | 'weekly'

export interface RecurringExpense {
  id: string
  userId: string
  title: string
  amountPaise: number
  category: ExpenseCategory
  frequency: RecurringFrequency
  billingDay: number // 1 to 31
  nextDueDate: string // YYYY-MM-DD
  isActive: boolean
  paymentMethod?: PaymentMethod
  note?: string
  createdAt: number
  updatedAt: number
}

export interface DetectedRecurringPattern {
  title: string
  category: ExpenseCategory
  amountPaise: number
  frequency: RecurringFrequency
  suggestedBillingDay: number
  occurrences: number
  confidence: number // 0 to 1
  sampleExpenseIds: string[]
}
