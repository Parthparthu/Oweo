/**
 * useIntersectionReveal.ts
 * Custom hook that returns a ref and isVisible state for scroll-triggered reveals.
 * Uses IntersectionObserver — no external dependencies.
 */
import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Fraction of the element visible before triggering (0–1). Default 0.1 */
  threshold?: number
  /** CSS margin around the root. Default '0px 0px -40px 0px' */
  rootMargin?: string
  /** Only trigger once (don't reset on scroll out). Default true */
  once?: boolean
}

export function useIntersectionReveal<T extends Element = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = '0px 0px -40px 0px',
  once = true,
}: Options = {}) {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect prefers-reduced-motion: reveal immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, isVisible }
}
