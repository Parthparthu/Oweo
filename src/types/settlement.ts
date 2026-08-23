export interface Settlement {
  id: string
  groupId: string
  payerId: string
  receiverId: string
  payerSnapshot: {
    displayName: string
    photoURL?: string | null
  }
  receiverSnapshot: {
    displayName: string
    photoURL?: string | null
  }
  amountPaise: number
  date: string // YYYY-MM-DD
  note?: string
  createdAt: number
}

export interface ProposedSettlement {
  fromUserId: string
  fromName: string
  fromPhoto?: string | null
  toUserId: string
  toName: string
  toPhoto?: string | null
  amountPaise: number
}

export interface MemberBalance {
  userId: string
  displayName: string
  photoURL?: string | null
  netBalancePaise: number // > 0 means gets back, < 0 means owes
  totalPaidPaise: number
  totalOwedPaise: number
}

export interface UserDebtSummary {
  userId: string
  displayName: string
  photoURL?: string | null
  groupId?: string
  groupName?: string
  amountPaise: number // positive means they owe user, negative means user owes them
  type: 'you_are_owed' | 'you_owe'
  lastActivityDate?: string
}
