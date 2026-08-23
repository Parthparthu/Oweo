export type MemberRole = 'owner' | 'member'

export interface GroupMember {
  userId: string
  displayName: string
  email: string | null
  photoURL?: string | null
  role: MemberRole
  joinedAt: number
}

export interface Group {
  id: string
  name: string
  description?: string
  avatarColor?: string // hex or preset name
  createdBy: string
  memberIds: string[]
  createdAt: number
  updatedAt: number
}

export interface GroupInvite {
  inviteCode: string
  groupId: string
  groupName: string
  createdBy: string
  creatorName: string
  expiresAt: number // timestamp ms
  maxUses?: number
  usedCount: number
  isRevoked: boolean
  createdAt: number
}
