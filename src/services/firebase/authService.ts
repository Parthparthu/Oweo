import {
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  deleteUser,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, googleAuthProvider, isFirebaseConfigured } from './config'
import { UserProfile } from '@/types/user'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

/**
 * Initiates Google Sign-In popup with persistent local session.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase is not configured. Please add your credentials to .env')
  }

  try {
    const result = await signInWithPopup(auth, googleAuthProvider)
    return result.user
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled.')
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.')
    }
    if (error?.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.')
    }
    throw new Error(error?.message || 'Failed to sign in with Google.')
  }
}

/**
 * Signs out current user.
 */
export async function signOutUser(): Promise<void> {
  if (!auth) return
  await signOut(auth)
}

/**
 * Syncs user profile in Firestore `users/{uid}` on login or profile update.
 */
export async function syncUserProfile(
  user: FirebaseUser,
  customData: Partial<UserProfile> = {}
): Promise<UserProfile> {
  if (!db) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL,
      monthlyBudgetPaise: customData.monthlyBudgetPaise || 0,
      currency: 'INR',
      locale: 'en-IN',
      themePreference: 'system',
      accentColor: 'teal',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  const userRef = doc(db, 'users', user.uid)
  const existing = await getDoc(userRef)

  const now = Date.now()

  if (!existing.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || null,
      monthlyBudgetPaise: customData.monthlyBudgetPaise || 0,
      currency: 'INR',
      locale: 'en-IN',
      themePreference: customData.themePreference || 'system',
      accentColor: customData.accentColor || 'teal',
      createdAt: now,
      updatedAt: now,
    }
    await setDoc(userRef, sanitizeForFirestore(newProfile))
    return newProfile
  } else {
    const data = existing.data() as UserProfile
    const updatedProfile: UserProfile = {
      ...data,
      displayName: user.displayName || data.displayName,
      photoURL: user.photoURL || data.photoURL || null,
      ...customData,
      updatedAt: now,
    }
    await updateDoc(
      userRef,
      sanitizeForFirestore({
        displayName: updatedProfile.displayName,
        photoURL: updatedProfile.photoURL,
        ...customData,
        updatedAt: now,
      })
    )
    return updatedProfile
  }
}

/**
 * Fetches user profile by UID.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  return snap.exists() ? (snap.data() as UserProfile) : null
}

/**
 * Permanently deletes user account, their personal expenses, and user document.
 */
export async function deleteUserAccount(): Promise<void> {
  if (!auth || !auth.currentUser || !db) return

  const uid = auth.currentUser.uid

  // 1. Delete personal expenses
  const expenseQ = query(collection(db, 'expenses'), where('userId', '==', uid))
  const snap = await getDocs(expenseQ)
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))

  // 2. Delete user doc
  const userRef = doc(db, 'users', uid)
  batch.delete(userRef)

  await batch.commit()

  // 3. Delete auth account
  await deleteUser(auth.currentUser)
}
