export type DirectDebtType = 'you_paid' | 'they_paid' // 'you_paid' => they owe you; 'they_paid' => you owe them

export interface DirectDebt {
  id: string
  creatorId: string
  otherUserId?: string | null
  otherUserName: string
  otherUserPhoto?: string | null
  amountPaise: number
  type: DirectDebtType
  title: string
  note?: string
  date: string // YYYY-MM-DD
  isSettled: boolean
  settledAt?: number | null
  createdAt: number
  updatedAt: number
}
