import React from 'react'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { vi, afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<any>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    motion: new Proxy(
      {},
      {
        get: (_, tag: string) => {
          const Comp = React.forwardRef(
            (
              {
                children,
                whileHover,
                whileTap,
                whileFocus,
                whileDrag,
                whileInView,
                initial,
                animate,
                exit,
                transition,
                variants,
                layout,
                layoutId,
                ...props
              }: any,
              ref: any
            ) => {
              return React.createElement(tag, { ...props, ref }, children)
            }
          )
          Comp.displayName = `motion.${tag}`
          return Comp
        },
      }
    ),
  }
})

// Mock requestAnimationFrame for JSDOM
if (typeof window !== 'undefined') {
  window.requestAnimationFrame = (callback) => setTimeout(callback, 0)
  window.cancelAnimationFrame = (id) => clearTimeout(id)
}
global.requestAnimationFrame = (callback) => setTimeout(callback, 0) as unknown as number
global.cancelAnimationFrame = (id) => clearTimeout(id)

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
