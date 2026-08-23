/**
 * Dialog.tsx  (Phase 9 — Animated Dialog)
 *
 * Changes vs original:
 *  ✅ All props, Escape key handling, body scroll lock 100% preserved
 *  + AnimatePresence for backdrop + dialog mount/unmount animations
 *  + Backdrop fades in, dialog scales up with spring
 *  + Close button gets hover/tap feedback
 */
import React, { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

const maxWidths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-3xl',
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable && focusable.length > 0) {
          // If the first element is close button and there's another input, focus the input or first
          if (focusable.length > 1 && focusable[0].getAttribute('aria-label') === 'Close dialog') {
            focusable[1].focus()
          } else {
            focusable[0].focus()
          }
        }
      }, 50)

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
          return
        }

        if (e.key === 'Tab' && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
          if (!focusable.length) return

          const firstElement = focusable[0]
          const lastElement = focusable[focusable.length - 1]

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus()
              e.preventDefault()
            }
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
        previousActiveElement.current?.focus?.()
      }
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 sm:p-6 overflow-y-auto overscroll-contain">
          {/* Animated backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Dialog body */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            className={twMerge(
              clsx(
                'relative w-full rounded-2xl bg-card border border-border/80 p-4 xs:p-5 sm:p-6 shadow-2xl z-10 text-card-foreground',
                'max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col',
                maxWidths[maxWidth],
                className
              )
            )}
            initial={{ opacity: 0, scale: 0.93, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4 shrink-0">
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 className="text-base sm:text-xl font-bold tracking-tight truncate sm:whitespace-normal">{title}</h2>
                )}
                {description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
              {showCloseButton && (
                <motion.button
                  onClick={onClose}
                  className="rounded-xl p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  aria-label="Close dialog"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88, rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>
            <div className="overflow-y-auto overscroll-contain flex-1 pr-0.5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
