export type ExpenseCategory =
  | 'Food'
  | 'Travel'
  | 'Rent'
  | 'Education'
  | 'Shopping'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Health'
  | 'Bills'
  | 'Personal Care'
  | 'Groceries'
  | 'Gifts'
  | 'Settlement'
  | 'Other'

export type PaymentMethod = 'UPI' | 'Card' | 'Cash' | 'Net Banking' | 'Other'

export interface PersonalExpense {
  id: string
  userId: string
  amountPaise: number // Integer minor units (e.g. 18000 = ₹180.00)
  category: ExpenseCategory
  title: string
  note?: string
  date: string // YYYY-MM-DD
  paymentMethod?: PaymentMethod
  tags?: string[]
  isGroupExpense?: boolean
  groupId?: string
  groupExpenseId?: string
  groupName?: string
  createdAt: number // timestamp ms
  updatedAt: number // timestamp ms
}

export type SplitType = 'equal' | 'exact' | 'percentage'

export interface ParticipantShare {
  userId: string
  displayNameSnapshot: string
  photoURLSnapshot?: string | null
  amountPaise: number
  percentage?: number // e.g. 33.33
}

export interface GroupExpense {
  id: string
  groupId: string
  payerId: string
  payerSnapshot: {
    displayName: string
    photoURL?: string | null
  }
  amountPaise: number
  title: string
  category: ExpenseCategory
  date: string // YYYY-MM-DD
  note?: string
  splitType: SplitType
  participants: Record<string, ParticipantShare> // key is userId
  createdAt: number
  updatedAt: number
}
