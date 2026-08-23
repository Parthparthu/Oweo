import React, { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { User } from 'lucide-react'

export interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base font-semibold',
    xl: 'h-16 w-16 text-lg font-bold',
  }

  // Derive initials from name
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  // Deterministic subtle pastel gradient based on name hash
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-indigo-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-600',
  ]
  const colorIndex = (name || 'User')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const bgGradient = colors[colorIndex]

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImageError(true)}
        className={twMerge(
          clsx(
            'rounded-full object-cover shrink-0 border border-border/50 shadow-sm',
            sizeClasses[size],
            className
          )
        )}
      />
    )
  }

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 bg-gradient-to-br',
          bgGradient,
          sizeClasses[size],
          className
        )
      )}
    >
      {initials || <User className="h-4 w-4" />}
    </div>
  )
}
