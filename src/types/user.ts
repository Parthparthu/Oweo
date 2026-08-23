export interface UserProfile {
  uid: string
  email: string | null
  displayName: string
  photoURL: string | null
  monthlyBudgetPaise: number // 0 means not set
  categoryBudgetsPaise?: Record<string, number>
  currency: string // default 'INR'
  locale: string // default 'en-IN'
  themePreference: 'light' | 'dark' | 'system'
  accentColor: string // 'teal' | 'emerald' | 'indigo' | 'violet' | 'rose' | 'amber' | hex
  customAccentHex?: string
  createdAt: number // timestamp ms
  updatedAt: number // timestamp ms
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  accent: string
  customHex?: string
  currency: string
  monthlyBudgetPaise: number
}
