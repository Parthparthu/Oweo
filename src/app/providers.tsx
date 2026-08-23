import React, { useEffect } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initTheme = useThemeStore((state) => state.initTheme)
  const initAuth = useAuthStore((state) => state.initAuth)

  // Initialize theme on mount & listen to system theme changes
  useEffect(() => {
    initTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      if (useThemeStore.getState().theme === 'system') {
        initTheme()
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [initTheme])

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsub = initAuth()
    return () => unsub()
  }, [initAuth])

  return (
    <ErrorBoundary>
      <ToastProvider>{children}</ToastProvider>
    </ErrorBoundary>
  )
}
