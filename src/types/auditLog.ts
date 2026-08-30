export type AuditAction = 'create' | 'update' | 'delete' | 'settle'
export type AuditEntityType = 'expense' | 'settlement'

export interface GroupAuditLog {
  id: string
  groupId: string
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  actorId: string
  actorSnapshot: {
    displayName: string
    photoURL?: string | null
  }
  summary: string
  beforeState?: Record<string, any> | null
  afterState?: Record<string, any> | null
  timestamp: number // ms
}
