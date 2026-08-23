import React from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { LoginView } from './LoginView'
import { LoadingScreen } from '@/components/feedback/LoadingScreen'
import { FirebaseSetupGuide } from '@/components/feedback/FirebaseSetupGuide'

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isConfigured } = useAuthStore()

  if (!isConfigured) {
    return <FirebaseSetupGuide />
  }

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (!user) {
    return <LoginView />
  }

  return <>{children}</>
}
