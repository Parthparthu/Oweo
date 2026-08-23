/**
 * Sheet.tsx  (Phase 9 — Animated Bottom Sheet)
 *
 * Changes vs original:
 *  ✅ All props, Escape key, scroll lock, side variants 100% preserved
 *  + AnimatePresence for smooth enter/exit
 *  + Bottom sheet springs up from y:100% with spring physics
 *  + Right sheet slides in from x:100%
 *  + Backdrop fades in/out
 *  + Drag handle visually enhanced
 */
import React, { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SheetProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
  side?: 'bottom' | 'right'
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  side = 'bottom',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable && focusable.length > 0) {
          if (focusable.length > 1 && focusable[0].getAttribute('aria-label') === 'Close sheet') {
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

        if (e.key === 'Tab' && sheetRef.current) {
          const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
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

  // Animation variants per side
  const sheetVariants =
    side === 'bottom'
      ? {
          hidden: { y: '100%', opacity: 0.5 },
          visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 320, damping: 35, mass: 0.9 },
          },
          exit: {
            y: '100%',
            opacity: 0,
            transition: { duration: 0.22, ease: 'easeIn' },
          },
        }
      : {
          hidden: { x: '100%', opacity: 0.5 },
          visible: {
            x: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 32 },
          },
          exit: {
            x: '100%',
            opacity: 0,
            transition: { duration: 0.2, ease: 'easeIn' },
          },
        }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={clsx(
            'fixed inset-0 z-50 overflow-hidden',
            side === 'bottom'
              ? 'flex items-end sm:items-center sm:justify-center'
              : 'flex justify-end'
          )}
        >
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

          {/* Sheet panel */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            className={twMerge(
              clsx(
                'relative w-full bg-card border-t sm:border border-border/80 p-4 xs:p-5 sm:p-6 shadow-2xl z-10 text-card-foreground flex flex-col',
                'max-h-[90dvh] sm:max-h-[85dvh]',
                side === 'bottom'
                  ? 'rounded-t-3xl sm:rounded-2xl sm:max-w-lg pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'
                  : 'sm:max-w-md h-full rounded-l-3xl',
                className
              )
            )}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Mobile drag handle bar */}
            <motion.div
              className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 sm:hidden shrink-0"
              whileHover={{ scaleX: 1.3, backgroundColor: 'hsl(var(--muted-foreground) / 0.5)' }}
              transition={{ duration: 0.2 }}
            />

            <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate sm:whitespace-normal">{title}</h2>
                )}
                {description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
              <motion.button
                onClick={onClose}
                className="rounded-xl p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                aria-label="Close sheet"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.88, rotate: 90 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1 pr-0.5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
