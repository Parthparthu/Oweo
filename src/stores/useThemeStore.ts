import { create } from 'zustand'
import { applyAccentToDocument } from '@/styles/themeTokens'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: ThemeMode
  accent: string
  customHex?: string
  isDarkEffective: boolean
  setTheme: (theme: ThemeMode) => void
  setAccent: (accent: string, customHex?: string) => void
  initTheme: () => void
}

const STORAGE_KEY = 'oweo_theme_settings'

function getInitialState(): { theme: ThemeMode; accent: string; customHex?: string } {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    }
  } catch {
    // Ignore error
  }
  return {
    theme: 'system',
    accent: 'teal',
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  ...getInitialState(),
  isDarkEffective: false,

  setTheme: (theme: ThemeMode) => {
    set({ theme })
    try {
      const state = get()
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            theme,
            accent: state.accent,
            customHex: state.customHex,
          })
        )
      }
    } catch {
      // Ignore
    }
    get().initTheme()
  },

  setAccent: (accent: string, customHex?: string) => {
    set({ accent, customHex })
    try {
      const state = get()
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            theme: state.theme,
            accent,
            customHex,
          })
        )
      }
    } catch {
      // Ignore
    }
    get().initTheme()
  },

  initTheme: () => {
    const { theme, accent, customHex } = get()
    let systemDark = false
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    const isDark = theme === 'dark' || (theme === 'system' && systemDark)

    set({ isDarkEffective: isDark })

    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      applyAccentToDocument(accent, customHex, isDark)
    }
  },
}))
