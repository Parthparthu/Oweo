/**
 * useMagneticEffect.ts
 * Returns event handlers and a style object that creates a magnetic "pull"
 * toward the mouse when hovering over an element.
 *
 * Usage:
 *   const magnetic = useMagneticEffect({ strength: 0.35 })
 *   <button {...magnetic.handlers} style={magnetic.style}>...</button>
 */
import { useCallback, useRef, useState } from 'react'

interface MagneticOptions {
  /** How far the element moves relative to cursor offset. 0–1. Default 0.35 */
  strength?: number
  /** Whether the effect is active. Default true */
  enabled?: boolean
}

export function useMagneticEffect({ strength = 0.35, enabled = true }: MagneticOptions = {}) {
  const ref = useRef<HTMLElement>(null)
  const [transform, setTransform] = useState('translate(0px, 0px)')
  const animRef = useRef<number | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return
      const el = e.currentTarget as HTMLElement
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) * strength
      const dy = (e.clientY - cy) * strength

      if (animRef.current) cancelAnimationFrame(animRef.current)
      animRef.current = requestAnimationFrame(() => {
        setTransform(`translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`)
      })
    },
    [strength, enabled]
  )

  const handleMouseLeave = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setTransform('translate(0px, 0px)')
  }, [])

  return {
    ref,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
    style: {
      transform,
      transition: transform === 'translate(0px, 0px)'
        ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        : 'transform 0.15s linear',
      willChange: 'transform',
    } as React.CSSProperties,
  }
}
