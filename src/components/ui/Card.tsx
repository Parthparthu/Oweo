import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'flat' | 'interactive'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-card text-card-foreground border border-border/70 shadow-sm shadow-black/5',
      elevated: 'bg-card text-card-foreground border border-border/40 shadow-md shadow-black/5 hover:shadow-lg transition-shadow',
      outline: 'bg-transparent border border-border text-foreground',
      flat: 'bg-muted/50 text-foreground border-transparent',
      interactive: 'bg-card text-card-foreground border border-border/70 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]',
    }

    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-2xl p-4 sm:p-5 transition-colors',
            variants[variant],
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
