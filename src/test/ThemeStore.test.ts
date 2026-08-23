import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '@/stores/useThemeStore'

describe('Theme & Accent Customization Store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('updates theme mode correctly to dark, light, or system', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')

    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('updates accent color and applies preset tokens', () => {
    useThemeStore.getState().setAccent('emerald')
    expect(useThemeStore.getState().accent).toBe('emerald')

    useThemeStore.getState().setAccent('custom', '#e11d48')
    expect(useThemeStore.getState().accent).toBe('custom')
    expect(useThemeStore.getState().customHex).toBe('#e11d48')
  })
})
