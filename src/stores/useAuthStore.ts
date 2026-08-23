import { create } from 'zustand'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/services/firebase/config'
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
  updateMonthlyBudget: (monthlyBudgetPaise: number) => Promise<void>
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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        set({ user: currentUser })
        try {
          let profile = await getUserProfile(currentUser.uid)
          if (!profile) {
            profile = await syncUserProfile(currentUser)
          }
          set({ profile, isLoading: false })

          // Apply saved user theme & accent if available
          if (profile) {
            const { theme, accent, customHex } = useThemeStore.getState()
            if (profile.themePreference && profile.themePreference !== theme) {
              useThemeStore.getState().setTheme(profile.themePreference)
            }
            if (profile.accentColor && profile.accentColor !== accent) {
              useThemeStore.getState().setAccent(profile.accentColor, profile.customAccentHex || customHex)
            }
          }
        } catch (err) {
          console.warn('Profile load notice:', err)
          set({ isLoading: false })
        }
      } else {
        set({ user: null, profile: null, isLoading: false })
      }
    })

    return unsubscribe
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

  updateMonthlyBudget: async (monthlyBudgetPaise: number) => {
    const { user, profile } = get()
    if (!user || !profile) return
    const updated = await syncUserProfile(user, { monthlyBudgetPaise })
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
