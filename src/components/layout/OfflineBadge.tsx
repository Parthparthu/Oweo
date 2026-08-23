import React from 'react'
import { WifiOff } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

export const OfflineBadge: React.FC = () => {
  const isOnline = useAuthStore((state) => state.isOnline)

  if (isOnline) return null

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold animate-fade-in shadow-sm">
      <WifiOff className="h-3.5 w-3.5" />
      <span>Offline Mode</span>
    </div>
  )
}
