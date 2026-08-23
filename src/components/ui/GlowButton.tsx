/**
 * GlowButton.tsx
 * Premium button extending the existing Button component with:
 * - Magnetic hover effect
 * - Glow ring on hover
 * - Shimmer sweep on hover
 * - Ripple click feedback
 *
 * All existing Button props are forwarded transparently.
 */
import React, { useRef, useState } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'
import { useMagneticEffect } from '@/hooks/useMagneticEffect'

interface Ripple {
  x: number
  y: number
  id: number
}

export interface GlowButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** Disable magnetic effect. Default false */
  noMagnetic?: boolean
  /** Disable glow. Default false */
  noGlow?: boolean
}

const variantStyles = {
  primary:
    'bg-primary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
  outline:
    'border border-border bg-transparent hover:bg-muted text-foreground',
  ghost:
    'hover:bg-muted text-foreground',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-destructive/20',
  subtle:
    'bg-primary/10 text-primary hover:bg-primary/20',
}

const sizeStyles = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-13 px-6 text-base font-semibold gap-2.5 min-h-[48px]',
  icon: 'h-10 w-10 p-0',
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      noMagnetic = false,
      noGlow = false,
      children,
      onClick,
      ...props
    },
    _ref
  ) => {
    const magnetic = useMagneticEffect({ strength: 0.3, enabled: !noMagnetic && !disabled })
    const [ripples, setRipples] = useState<Ripple[]>([])
    const buttonRef = useRef<HTMLButtonElement>(null)
    const rippleCounter = useRef(0)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Ripple effect
      const btn = buttonRef.current
      if (btn) {
        const rect = btn.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = rippleCounter.current++
        setRipples((prev) => [...prev, { x, y, id }])
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id))
        }, 700)
      }
      onClick?.(e)
    }

    return (
      <motion.button
        ref={(node) => {
          // Assign to both our internal ref and the forwarded ref
          ;(buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
          if (typeof _ref === 'function') _ref(node)
          else if (_ref) (_ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            'relative inline-flex items-center justify-center font-medium overflow-hidden',
            'select-none rounded-xl transition-opacity',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            variantStyles[variant],
            sizeStyles[size],
            !noGlow && variant === 'primary' && 'hover:shadow-glow-sm',
            className
          )
        )}
        onClick={handleClick}
        {...magnetic.handlers}
        style={magnetic.style as React.CSSProperties}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        <>
          {/* Shimmer sweep overlay on hover */}
          {!noGlow && variant === 'primary' && (
            <motion.span
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0, x: '-100%' }}
              whileHover={{ opacity: 1, x: '200%' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              }}
            />
          )}

          {/* Ripple effects */}
          {ripples.map((r) => (
            <span
              key={r.id}
              className="absolute rounded-full bg-white/25 pointer-events-none animate-ping"
              style={{
                width: 60,
                height: 60,
                left: r.x - 30,
                top: r.y - 30,
                animationDuration: '0.6s',
                animationIterationCount: '1',
                transformOrigin: 'center',
              }}
            />
          ))}

          {/* Content */}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            leftIcon && <span className="shrink-0">{leftIcon}</span>
          )}
          {children}
          {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      </motion.button>
    )
  }
)

GlowButton.displayName = 'GlowButton'
