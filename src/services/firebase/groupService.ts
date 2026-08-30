import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { Group, GroupMember, GroupInvite } from '@/types/group'
import { GroupExpense } from '@/types/expense'
import { Settlement } from '@/types/settlement'
import { generateId, generateInviteCode } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'
import { recordAuditLog } from './auditLogService'

export const DEFAULT_GROUP_WINDOW_SIZE = 50
export const DEFAULT_PAGE_SIZE = 20

/**
 * Subscribes to a bounded window of groups where the user is a member.
 */
export function subscribeUserGroups(
  userId: string,
  onUpdate: (groups: Group[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = DEFAULT_GROUP_WINDOW_SIZE
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const q = query(
    collection(db, 'groups'),
    where('memberIds', 'array-contains', userId),
    limit(limitCount)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Group[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Group)
      })
      list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      onUpdate(list)
    },
    (err) => {
      console.warn('Groups subscription notice:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Subscribes to a specific group document.
 */
export function subscribeGroup(
  groupId: string,
  onUpdate: (group: Group | null) => void
): Unsubscribe {
  if (!db) return () => {}
  const docRef = doc(db, 'groups', groupId)
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      onUpdate({ id: snap.id, ...snap.data() } as Group)
    } else {
      onUpdate(null)
    }
  })
}

/**
 * Subscribes to members of a group (`groups/{groupId}/members`).
 */
export function subscribeGroupMembers(
  groupId: string,
  onUpdate: (members: GroupMember[]) => void
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const colRef = collection(db, 'groups', groupId, 'members')
  return onSnapshot(colRef, (snapshot) => {
    const list: GroupMember[] = []
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as GroupMember)
    })
    onUpdate(list)
  })
}

/**
 * Subscribes to a bounded window of group expenses (`groups/{groupId}/expenses`).
 */
export function subscribeGroupExpenses(
  groupId: string,
  onUpdate: (expenses: GroupExpense[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = DEFAULT_GROUP_WINDOW_SIZE
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const colRef = collection(db, 'groups', groupId, 'expenses')
  const q = query(colRef, limit(limitCount))

  return onSnapshot(
    q,
    (snapshot) => {
      const list: GroupExpense[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as GroupExpense)
      })
      list.sort((a, b) => {
        const dateComp = (b.date || '').localeCompare(a.date || '')
        if (dateComp !== 0) return dateComp
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
      onUpdate(list)
    },
    (err) => {
      console.warn('Group expenses subscription notice:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Fetches a paginated page of group expenses using cursor-based pagination.
 */
export async function fetchGroupExpensesPage(
  groupId: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
  lastDoc?: DocumentSnapshot | null
): Promise<{ expenses: GroupExpense[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  if (!db) {
    return { expenses: [], lastDoc: null, hasMore: false }
  }

  const colRef = collection(db, 'groups', groupId, 'expenses')
  let q = query(colRef, limit(pageSize + 1))
  if (lastDoc) {
    q = query(colRef, startAfter(lastDoc), limit(pageSize + 1))
  }

  const snapshot = await getDocs(q)
  const docs = snapshot.docs
  const hasMore = docs.length > pageSize
  const resultDocs = hasMore ? docs.slice(0, pageSize) : docs

  const list: GroupExpense[] = resultDocs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as GroupExpense[]

  list.sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '')
    if (dateComp !== 0) return dateComp
    return (b.createdAt || 0) - (a.createdAt || 0)
  })

  const newLastDoc = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null

  return {
    expenses: list,
    lastDoc: newLastDoc,
    hasMore,
  }
}

/**
 * Subscribes to a bounded window of group settlements (`groups/{groupId}/settlements`).
 */
export function subscribeGroupSettlements(
  groupId: string,
  onUpdate: (settlements: Settlement[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = DEFAULT_GROUP_WINDOW_SIZE
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const colRef = collection(db, 'groups', groupId, 'settlements')
  const q = query(colRef, limit(limitCount))

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Settlement[] = []
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Settlement)
      })
      list.sort((a, b) => {
        const dateComp = (b.date || '').localeCompare(a.date || '')
        if (dateComp !== 0) return dateComp
        return (b.createdAt || 0) - (a.createdAt || 0)
      })
      onUpdate(list)
    },
    (err) => {
      console.warn('Group settlements subscription notice:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Creates a new group and automatically registers the creator as an 'owner' member.
 */
export async function createGroup(
  name: string,
  description: string = '',
  creator: { uid: string; displayName: string; email: string | null; photoURL?: string | null }
): Promise<Group> {
  if (!db) throw new Error('Database is not initialized')

  const groupId = generateId('grp')
  const now = Date.now()

  const newGroup: Group = {
    id: groupId,
    name: name.trim(),
    description: description.trim(),
    createdBy: creator.uid,
    memberIds: [creator.uid],
    createdAt: now,
    updatedAt: now,
  }

  const creatorMember: GroupMember = {
    userId: creator.uid,
    displayName: creator.displayName,
    email: creator.email,
    photoURL: creator.photoURL || null,
    role: 'owner',
    joinedAt: now,
  }

  // 1. Create group document
  await setDoc(doc(db, 'groups', groupId), sanitizeForFirestore(newGroup))
  // 2. Add creator to members subcollection
  await setDoc(doc(db, 'groups', groupId, 'members', creator.uid), sanitizeForFirestore(creatorMember))

  // 3. Record audit log
  await recordAuditLog({
    groupId,
    entityType: 'expense',
    entityId: groupId,
    action: 'create',
    actorId: creator.uid,
    actorSnapshot: {
      displayName: creator.displayName,
      photoURL: creator.photoURL || null,
    },
    summary: `Created group "${newGroup.name}"`,
  })

  return newGroup
}

/**
 * Adds an expense to a group and records an audit log entry.
 */
export async function addGroupExpense(
  groupId: string,
  expenseData: Omit<GroupExpense, 'id' | 'groupId' | 'createdAt' | 'updatedAt'>
): Promise<GroupExpense> {
  if (!db) throw new Error('Database is not initialized')

  const id = generateId('gexp')
  const now = Date.now()

  const expense: GroupExpense = {
    ...expenseData,
    id,
    groupId,
    createdAt: now,
    updatedAt: now,
  }

  // Add to subcollection
  await setDoc(doc(db, 'groups', groupId, 'expenses', id), sanitizeForFirestore(expense))

  // Update group updatedAt
  await updateDoc(doc(db, 'groups', groupId), {
    updatedAt: now,
  })

  // Append to audit log
  await recordAuditLog({
    groupId,
    entityType: 'expense',
    entityId: id,
    action: 'create',
    actorId: expenseData.payerId,
    actorSnapshot: {
      displayName: expenseData.payerSnapshot?.displayName || 'Member',
      photoURL: expenseData.payerSnapshot?.photoURL || null,
    },
    summary: `Added expense "${expenseData.title}" of ₹${(expenseData.amountPaise / 100).toFixed(2)}`,
    afterState: expense,
  })

  return expense
}

/**
 * Updates a group expense and records an audit log entry.
 */
export async function updateGroupExpense(
  groupId: string,
  expenseId: string,
  partial: Partial<GroupExpense>,
  actor: { uid: string; displayName: string; photoURL?: string | null }
): Promise<void> {
  if (!db) return
  const now = Date.now()
  const docRef = doc(db, 'groups', groupId, 'expenses', expenseId)

  // Fetch current state for audit beforeState
  const currentSnap = await getDoc(docRef)
  const beforeState = currentSnap.exists() ? currentSnap.data() : null

  await updateDoc(
    docRef,
    sanitizeForFirestore({
      ...partial,
      updatedAt: now,
    })
  )

  await updateDoc(doc(db, 'groups', groupId), {
    updatedAt: now,
  })

  // Append to audit log
  await recordAuditLog({
    groupId,
    entityType: 'expense',
    entityId: expenseId,
    action: 'update',
    actorId: actor.uid,
    actorSnapshot: {
      displayName: actor.displayName,
      photoURL: actor.photoURL || null,
    },
    summary: `Updated expense "${partial.title || beforeState?.title || 'Expense'}"`,
    beforeState,
    afterState: { ...beforeState, ...partial, updatedAt: now },
  })
}

/**
 * Deletes a group expense and records an audit log entry.
 */
export async function deleteGroupExpense(
  groupId: string,
  expenseId: string,
  actor: { uid: string; displayName: string; photoURL?: string | null }
): Promise<void> {
  if (!db) return
  const docRef = doc(db, 'groups', groupId, 'expenses', expenseId)

  const currentSnap = await getDoc(docRef)
  const beforeState = currentSnap.exists() ? currentSnap.data() : null

  await deleteDoc(docRef)
  await updateDoc(doc(db, 'groups', groupId), {
    updatedAt: Date.now(),
  })

  // Append to audit log
  await recordAuditLog({
    groupId,
    entityType: 'expense',
    entityId: expenseId,
    action: 'delete',
    actorId: actor.uid,
    actorSnapshot: {
      displayName: actor.displayName,
      photoURL: actor.photoURL || null,
    },
    summary: `Deleted expense "${beforeState?.title || 'Expense'}"`,
    beforeState,
  })
}

/**
 * Records a manual settlement in a group and appends an audit log entry.
 */
export async function recordGroupSettlement(
  groupId: string,
  settlementData: Omit<Settlement, 'id' | 'groupId' | 'createdAt'>
): Promise<Settlement> {
  if (!db) throw new Error('Database is not initialized')

  const id = generateId('stl')
  const now = Date.now()

  const settlement: Settlement = {
    ...settlementData,
    id,
    groupId,
    createdAt: now,
  }

  await setDoc(doc(db, 'groups', groupId, 'settlements', id), sanitizeForFirestore(settlement))

  await updateDoc(doc(db, 'groups', groupId), {
    updatedAt: now,
  })

  // Append to audit log
  await recordAuditLog({
    groupId,
    entityType: 'settlement',
    entityId: id,
    action: 'settle',
    actorId: settlementData.payerId,
    actorSnapshot: {
      displayName: settlementData.payerSnapshot?.displayName || 'Member',
      photoURL: settlementData.payerSnapshot?.photoURL || null,
    },
    summary: `Recorded settlement of ₹${(settlementData.amountPaise / 100).toFixed(2)} to ${
      settlementData.receiverSnapshot?.displayName || 'Member'
    }`,
    afterState: settlement,
  })

  return settlement
}

/**
 * Generates a shareable invite code for a group.
 */
export async function createGroupInvite(
  groupId: string,
  groupName: string,
  creator: { uid: string; displayName: string },
  expiresInDays: number = 7
): Promise<GroupInvite> {
  if (!db) throw new Error('Database is not initialized')

  const inviteCode = generateInviteCode()
  const now = Date.now()
  const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000

  const invite: GroupInvite = {
    inviteCode,
    groupId,
    groupName,
    createdBy: creator.uid,
    creatorName: creator.displayName,
    expiresAt,
    usedCount: 0,
    isRevoked: false,
    createdAt: now,
  }

  await setDoc(doc(db, 'invites', inviteCode), sanitizeForFirestore(invite))
  return invite
}

/**
 * Validates and redeems an invite code to join a group.
 */
export async function redeemGroupInvite(
  inviteCode: string,
  user: { uid: string; displayName: string; email: string | null; photoURL?: string | null }
): Promise<{ success: boolean; groupName: string; groupId: string; message?: string }> {
  if (!db) throw new Error('Database is not initialized')

  const inviteRef = doc(db, 'invites', inviteCode.trim().toUpperCase())
  const inviteSnap = await getDoc(inviteRef)

  if (!inviteSnap.exists()) {
    throw new Error('Invalid invite link or code.')
  }

  const invite = inviteSnap.data() as GroupInvite

  if (invite.isRevoked) {
    throw new Error('This invitation link has been revoked.')
  }

  if (Date.now() > invite.expiresAt) {
    throw new Error('This invitation link has expired.')
  }

  const groupRef = doc(db, 'groups', invite.groupId)
  const groupSnap = await getDoc(groupRef)

  if (!groupSnap.exists()) {
    throw new Error('The group associated with this invite no longer exists.')
  }

  const group = groupSnap.data() as Group

  // If already a member
  if (group.memberIds.includes(user.uid)) {
    return {
      success: true,
      groupName: group.name,
      groupId: group.id,
      message: 'You are already a member of this group!',
    }
  }

  const newMember: GroupMember = {
    userId: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL || null,
    role: 'member',
    joinedAt: Date.now(),
  }

  // 1. Add to group members subcollection
  await setDoc(doc(db, 'groups', invite.groupId, 'members', user.uid), sanitizeForFirestore(newMember))

  // 2. Add uid to group memberIds array
  await updateDoc(groupRef, {
    memberIds: arrayUnion(user.uid),
    updatedAt: Date.now(),
  })

  // 3. Increment used count
  await updateDoc(inviteRef, {
    usedCount: (invite.usedCount || 0) + 1,
  })

  // 4. Record audit log
  await recordAuditLog({
    groupId: group.id,
    entityType: 'expense',
    entityId: user.uid,
    action: 'create',
    actorId: user.uid,
    actorSnapshot: {
      displayName: user.displayName,
      photoURL: user.photoURL || null,
    },
    summary: `${user.displayName} joined the group`,
  })

  return {
    success: true,
    groupName: group.name,
    groupId: group.id,
    message: `Successfully joined ${group.name}!`,
  }
}

/**
 * Removes a user from a group.
 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  if (!db) return

  // Remove from memberIds
  await updateDoc(doc(db, 'groups', groupId), {
    memberIds: arrayRemove(userId),
    updatedAt: Date.now(),
  })

  // Delete from members subcollection
  await deleteDoc(doc(db, 'groups', groupId, 'members', userId))
}
