import {
  collection,
  doc,
  setDoc,
  query,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { GroupAuditLog } from '@/types/auditLog'
import { generateId } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

/**
 * Appends an immutable audit log record to a group's audit trail.
 */
export async function recordAuditLog(
  logData: Omit<GroupAuditLog, 'id' | 'timestamp'>
): Promise<GroupAuditLog | null> {
  if (!db) return null

  try {
    const id = generateId('audit')
    const timestamp = Date.now()

    const log: GroupAuditLog = {
      ...logData,
      id,
      timestamp,
    }

    const docRef = doc(db, 'groups', logData.groupId, 'auditLogs', id)
    await setDoc(docRef, sanitizeForFirestore(log))
    return log
  } catch (error) {
    console.warn('Failed to write audit log:', error)
    return null
  }
}

/**
 * Subscribes to the most recent bounded window of audit logs for a group.
 */
export function subscribeGroupAuditLogs(
  groupId: string,
  onUpdate: (logs: GroupAuditLog[]) => void,
  onError?: (err: Error) => void,
  limitCount: number = 30
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const colRef = collection(db, 'groups', groupId, 'auditLogs')
  const q = query(colRef, limit(limitCount))

  return onSnapshot(
    q,
    (snapshot) => {
      const list: GroupAuditLog[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as GroupAuditLog)
      })

      // In-memory sort by timestamp descending
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      onUpdate(list)
    },
    (err) => {
      console.warn('Audit log subscription notice:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Fetches older audit logs page with cursor-based pagination.
 */
export async function fetchGroupAuditLogsPage(
  groupId: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ logs: GroupAuditLog[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  if (!db) {
    return { logs: [], lastDoc: null, hasMore: false }
  }

  const colRef = collection(db, 'groups', groupId, 'auditLogs')
  let q = query(colRef, limit(pageSize + 1))
  if (lastDoc) {
    q = query(colRef, startAfter(lastDoc), limit(pageSize + 1))
  }

  const snapshot = await getDocs(q)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const resultDocs = hasMore ? docs.slice(0, pageSize) : docs

  const list: GroupAuditLog[] = resultDocs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as GroupAuditLog[]

  list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  const newLastDoc = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null

  return {
    logs: list,
    lastDoc: newLastDoc,
    hasMore,
  }
}
