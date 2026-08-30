import React, { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

export const OfflineBadge: React.FC = () => {
  const isOnline = useAuthStore((state) => state.isOnline)
  const setOnlineStatus = useAuthStore((state) => state.setOnlineStatus)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true)
      setJustReconnected(true)
      const t = setTimeout(() => setJustReconnected(false), 3000)
      return () => clearTimeout(t)
    }

    const handleOffline = () => {
      setOnlineStatus(false)
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])

  if (justReconnected) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-fade-in shadow-sm select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span>Synced with Cloud</span>
      </div>
    )
  }

  if (isOnline) return null

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold animate-fade-in shadow-sm select-none"
      title="You are offline. Transactions are stored in local IndexedDB and will sync when reconnected."
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Offline (Saved locally)</span>
    </div>
  )
}
