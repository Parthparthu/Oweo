/**
 * Skeleton.tsx  (Phase 8 — Premium Shimmer Skeleton)
 *
 * Changes vs original:
 *  ✅ Same props interface (className + div html attrs)
 *  + Directional shimmer sweep (left-to-right light streak)
 *  + More natural timing vs simple animate-pulse
 */
import React from 'react'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-xl bg-muted overflow-hidden',
          className
        )
      )}
      {...props}
    >
      {/* Shimmer sweep */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer-slide bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}
