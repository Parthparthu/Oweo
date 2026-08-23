export interface AccentOption {
  id: string
  name: string
  colorHex: string
  hsl: {
    light: {
      primary: string
      primary50: string
      primary100: string
      primary200: string
      primary500: string
      primary600: string
      primary700: string
    }
    dark: {
      primary: string
      primary50: string
      primary100: string
      primary200: string
      primary500: string
      primary600: string
      primary700: string
    }
  }
}

export const ACCENT_PRESETS: AccentOption[] = [
  {
    id: 'teal',
    name: 'Teal (Default)',
    colorHex: '#0d9488',
    hsl: {
      light: {
        primary: '173 80% 36%',
        primary50: '166 76% 97%',
        primary100: '167 85% 89%',
        primary200: '168 84% 78%',
        primary500: '173 80% 36%',
        primary600: '175 84% 29%',
        primary700: '176 80% 24%',
      },
      dark: {
        primary: '173 80% 42%',
        primary50: '176 80% 12%',
        primary100: '175 84% 18%',
        primary200: '173 80% 24%',
        primary500: '173 80% 42%',
        primary600: '171 77% 50%',
        primary700: '168 84% 78%',
      },
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    colorHex: '#059669',
    hsl: {
      light: {
        primary: '160 84% 39%',
        primary50: '152 81% 96%',
        primary100: '149 80% 90%',
        primary200: '152 76% 80%',
        primary500: '160 84% 39%',
        primary600: '161 94% 30%',
        primary700: '163 94% 24%',
      },
      dark: {
        primary: '160 84% 45%',
        primary50: '163 94% 12%',
        primary100: '161 94% 18%',
        primary200: '160 84% 25%',
        primary500: '160 84% 45%',
        primary600: '158 79% 55%',
        primary700: '152 76% 80%',
      },
    },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    colorHex: '#4f46e5',
    hsl: {
      light: {
        primary: '243 75% 59%',
        primary50: '240 100% 98%',
        primary100: '243 100% 95%',
        primary200: '244 97% 91%',
        primary500: '243 75% 59%',
        primary600: '244 76% 53%',
        primary700: '245 58% 51%',
      },
      dark: {
        primary: '243 75% 65%',
        primary50: '245 58% 15%',
        primary100: '244 76% 22%',
        primary200: '243 75% 30%',
        primary500: '243 75% 65%',
        primary600: '239 84% 67%',
        primary700: '244 97% 91%',
      },
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    colorHex: '#7c3aed',
    hsl: {
      light: {
        primary: '262 83% 58%',
        primary50: '269 100% 98%',
        primary100: '269 100% 95%',
        primary200: '269 97% 89%',
        primary500: '262 83% 58%',
        primary600: '263 70% 50%',
        primary700: '264 67% 42%',
      },
      dark: {
        primary: '262 83% 66%',
        primary50: '264 67% 15%',
        primary100: '263 70% 22%',
        primary200: '262 83% 30%',
        primary500: '262 83% 66%',
        primary600: '265 89% 72%',
        primary700: '269 97% 89%',
      },
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    colorHex: '#e11d48',
    hsl: {
      light: {
        primary: '346 77% 50%',
        primary50: '355 100% 97%',
        primary100: '355 100% 94%',
        primary200: '353 96% 87%',
        primary500: '346 77% 50%',
        primary600: '347 77% 45%',
        primary700: '348 83% 38%',
      },
      dark: {
        primary: '346 77% 60%',
        primary50: '348 83% 15%',
        primary100: '347 77% 22%',
        primary200: '346 77% 30%',
        primary500: '346 77% 60%',
        primary600: '350 89% 68%',
        primary700: '353 96% 87%',
      },
    },
  },
  {
    id: 'amber',
    name: 'Amber',
    colorHex: '#d97706',
    hsl: {
      light: {
        primary: '38 92% 44%',
        primary50: '48 100% 96%',
        primary100: '48 100% 88%',
        primary200: '48 96% 76%',
        primary500: '38 92% 44%',
        primary600: '36 93% 38%',
        primary700: '32 81% 29%',
      },
      dark: {
        primary: '38 92% 52%',
        primary50: '32 81% 14%',
        primary100: '36 93% 20%',
        primary200: '38 92% 28%',
        primary500: '38 92% 52%',
        primary600: '43 96% 56%',
        primary700: '48 96% 76%',
      },
    },
  },
]

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace('#', '')
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('')
  }
  const num = parseInt(c, 16)
  const r = (num >> 16) / 255
  const g = ((num >> 8) & 0x00ff) / 255
  const b = (num & 0x0000ff) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h = Math.round(h * 60)
  }

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function applyAccentToDocument(accentId: string, customHex?: string, isDark?: boolean) {
  let root = document.documentElement
  let preset = ACCENT_PRESETS.find((p) => p.id === accentId)

  if (!preset && customHex) {
    const { h, s, l } = hexToHsl(customHex)
    const primaryStr = `${h} ${s}% ${isDark ? Math.min(l + 10, 65) : Math.max(l, 35)}%`
    root.style.setProperty('--primary', primaryStr)
    root.style.setProperty('--ring', primaryStr)
    root.style.setProperty('--primary-500', primaryStr)
    root.style.setProperty('--primary-50', `${h} ${Math.round(s * 0.8)}% ${isDark ? '14%' : '96%'}`)
    root.style.setProperty('--primary-100', `${h} ${Math.round(s * 0.8)}% ${isDark ? '20%' : '90%'}`)
    root.style.setProperty('--primary-200', `${h} ${Math.round(s * 0.8)}% ${isDark ? '28%' : '80%'}`)
    root.style.setProperty('--primary-600', `${h} ${s}% ${isDark ? '55%' : '30%'}`)
    root.style.setProperty('--primary-700', `${h} ${s}% ${isDark ? '75%' : '24%'}`)
    return
  }

  if (!preset) {
    preset = ACCENT_PRESETS[0] // fallback to Teal
  }

  const tokens = isDark ? preset.hsl.dark : preset.hsl.light
  root.style.setProperty('--primary', tokens.primary)
  root.style.setProperty('--ring', tokens.primary)
  root.style.setProperty('--primary-50', tokens.primary50)
  root.style.setProperty('--primary-100', tokens.primary100)
  root.style.setProperty('--primary-200', tokens.primary200)
  root.style.setProperty('--primary-500', tokens.primary500)
  root.style.setProperty('--primary-600', tokens.primary600)
  root.style.setProperty('--primary-700', tokens.primary700)
}
