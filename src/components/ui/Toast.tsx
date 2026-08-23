/**
 * Toast.tsx  (Phase 9 — Animated Toasts)
 *
 * Changes vs original:
 *  ✅ All ToastContext, showToast, removeToast, ToastItem 100% preserved
 *  ✅ useToast hook signature unchanged
 *  + AnimatePresence for smooth mount/unmount
 *  + Toast slides up from bottom with spring + fades out downward
 *  + Auto-dismiss progress bar animates across each toast
 *  + Enhanced glassmorphism styling
 */
import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.95,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    filter: 'blur(2px)',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

const ToastItem: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const duration = toast.duration ?? 3500

  return (
    <motion.div
      key={toast.id}
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={clsx(
        'pointer-events-auto relative flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold overflow-hidden',
        'backdrop-blur-xl',
        toast.type === 'success' && 'bg-emerald-950/90 text-emerald-100 border-emerald-800/50',
        toast.type === 'error' && 'bg-rose-950/90 text-rose-100 border-rose-800/50',
        toast.type === 'info' && 'bg-card/95 text-card-foreground border-border'
      )}
    >
      {/* Auto-dismiss progress bar */}
      <motion.div
        className={clsx(
          'absolute bottom-0 left-0 h-0.5 rounded-full',
          toast.type === 'success' && 'bg-emerald-400/60',
          toast.type === 'error' && 'bg-rose-400/60',
          toast.type === 'info' && 'bg-primary/60',
        )}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />

      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
        {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
        {toast.type === 'info' && <Info className="h-4 w-4 text-primary shrink-0" />}
        <span className="break-words text-xs sm:text-sm">{toast.message}</span>
      </div>

      <motion.button
        onClick={() => onRemove(toast.id)}
        className="rounded-lg p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-black/20 text-muted-foreground hover:text-foreground shrink-0"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.88 }}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </motion.button>
    </motion.div>
  )
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, type, message, duration }])
      setTimeout(() => removeToast(id), duration)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-[max(0.75rem,env(safe-area-inset-top,0px))] left-3 right-3 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none mx-auto sm:mx-0">
        <AnimatePresence initial={false} mode="sync">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
