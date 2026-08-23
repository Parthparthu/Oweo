import React, { useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  error?: string
  className?: string
  showQuickChips?: boolean
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  autoFocus = false,
  error,
  className,
  showQuickChips = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [autoFocus])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    // Remove invalid characters, allow single dot
    val = val.replace(/[^0-9.]/g, '')
    // Prevent multiple dots
    const parts = val.split('.')
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('')
    }
    // Limit decimal precision to 2 digits
    if (parts[1] && parts[1].length > 2) {
      val = parts[0] + '.' + parts[1].substring(0, 2)
    }
    onChange(val)
  }

  const addAmount = (increment: number) => {
    const current = parseFloat(value) || 0
    const next = current + increment
    onChange(next.toString())
    inputRef.current?.focus()
  }

  const isLongAmount = value.length > 7

  return (
    <div className={twMerge('w-full flex flex-col items-center', className)}>
      <div className="relative flex items-center justify-center w-full my-2">
        <span className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-primary mr-1.5 select-none transition-colors shrink-0">
          ₹
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          pattern="[0-9]*"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={clsx(
            'w-full max-w-[min(300px,80vw)] bg-transparent text-center font-black tracking-tight text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all tabular-nums',
            isLongAmount ? 'text-2xl xs:text-3xl sm:text-4xl' : 'text-3xl xs:text-4xl sm:text-5xl',
            error && 'text-destructive'
          )}
        />
      </div>

      {error && <p className="text-xs font-semibold text-destructive mt-1 text-center">{error}</p>}

      {showQuickChips && (
        <div className="flex items-center justify-center gap-1.5 xs:gap-2 mt-3 flex-wrap">
          {[50, 100, 200, 500, 1000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => addAmount(amt)}
              className="px-3 py-1.5 min-h-[36px] flex items-center justify-center rounded-full text-xs font-semibold bg-muted hover:bg-primary/15 hover:text-primary transition-all active:scale-95 text-foreground/80 border border-border/50 select-none"
            >
              +{amt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
