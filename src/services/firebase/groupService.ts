import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import { Group, GroupMember, GroupInvite } from '@/types/group'
import { GroupExpense } from '@/types/expense'
import { Settlement } from '@/types/settlement'
import { generateId, generateInviteCode } from '@/utils/idGenerator'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

/**
 * Subscribes to the list of groups where the user is a member.
 * Sorts in-memory so no composite index is needed.
 */
export function subscribeUserGroups(
  userId: string,
  onUpdate: (groups: Group[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const q = query(
    collection(db, 'groups'),
    where('memberIds', 'array-contains', userId)
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
 * Subscribes to group expenses (`groups/{groupId}/expenses`).
 * Sorts in-memory so subcollection query does not fail.
 */
export function subscribeGroupExpenses(
  groupId: string,
  onUpdate: (expenses: GroupExpense[]) => void
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const colRef = collection(db, 'groups', groupId, 'expenses')

  return onSnapshot(colRef, (snapshot) => {
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
  })
}

/**
 * Subscribes to group settlements (`groups/{groupId}/settlements`).
 */
export function subscribeGroupSettlements(
  groupId: string,
  onUpdate: (settlements: Settlement[]) => void
): Unsubscribe {
  if (!db) {
    onUpdate([])
    return () => {}
  }

  const colRef = collection(db, 'groups', groupId, 'settlements')

  return onSnapshot(colRef, (snapshot) => {
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
  })
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

  return newGroup
}

/**
 * Adds an expense to a group.
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

  return expense
}

/**
 * Records a manual settlement in a group.
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
