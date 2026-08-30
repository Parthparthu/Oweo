import { create } from 'zustand'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured, db } from '@/services/firebase/config'
import {
  signInWithGoogle,
  signOutUser,
  syncUserProfile,
  getUserProfile,
  deleteUserAccount,
} from '@/services/firebase/authService'
import { UserProfile } from '@/types/user'
import { useThemeStore } from './useThemeStore'

interface AuthState {
  user: FirebaseUser | null
  profile: UserProfile | null
  isLoading: boolean
  isConfigured: boolean
  isOnline: boolean
  initAuth: () => () => void
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateWalletBalance: (walletBalancePaise: number) => Promise<void>
  updatePreferences: (data: Partial<UserProfile>) => Promise<void>
  deleteAccount: () => Promise<void>
  setOnlineStatus: (isOnline: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isConfigured: isFirebaseConfigured(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline })
  },

  initAuth: () => {
    const isConfigured = isFirebaseConfigured()
    set({ isConfigured })

    if (!isConfigured || !auth) {
      set({ isLoading: false, user: null, profile: null })
      return () => {}
    }

    let profileUnsubscribe: () => void = () => {}

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        set({ user: currentUser })
        
        try {
          // Initialize if missing
          const existing = await getUserProfile(currentUser.uid)
          if (!existing) {
            await syncUserProfile(currentUser)
          } else {
            // Trigger seamless wallet migration if needed
            const { migrateUserWallet } = await import('@/services/firebase/migrationService')
            await migrateUserWallet(currentUser.uid)
          }

          // Real-time subscription to the user's profile
          if (db) {
            const { doc, onSnapshot } = await import('firebase/firestore')
            profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
              if (snap.exists()) {
                const profile = snap.data() as UserProfile
                set({ profile, isLoading: false })

                // Apply saved user theme & accent if available
                const { theme, accent, customHex } = useThemeStore.getState()
                if (profile.themePreference && profile.themePreference !== theme) {
                  useThemeStore.getState().setTheme(profile.themePreference)
                }
                if (profile.accentColor && profile.accentColor !== accent) {
                  useThemeStore.getState().setAccent(profile.accentColor, profile.customAccentHex || customHex)
                }
              }
            })
          }
        } catch (err) {
          console.warn('Profile load notice:', err)
          set({ isLoading: false })
        }
      } else {
        profileUnsubscribe()
        set({ user: null, profile: null, isLoading: false })
      }
    })

    return () => {
      unsubscribe()
      profileUnsubscribe()
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true })
    try {
      const user = await signInWithGoogle()
      const profile = await syncUserProfile(user)
      set({ user, profile, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await signOutUser()
      set({ user: null, profile: null, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  updateWalletBalance: async (walletBalancePaise: number) => {
    const { user, profile } = get()
    if (!user || !profile) return
    const updated = await syncUserProfile(user, { walletBalancePaise })
    set({ profile: updated })
  },

  updatePreferences: async (data: Partial<UserProfile>) => {
    const { user, profile } = get()
    if (!user || !profile) return
    const updated = await syncUserProfile(user, data)
    set({ profile: updated })
  },

  deleteAccount: async () => {
    set({ isLoading: true })
    try {
      await deleteUserAccount()
      set({ user: null, profile: null, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },
}))
