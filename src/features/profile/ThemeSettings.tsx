import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useThemeStore, ThemeMode } from '@/stores/useThemeStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { ACCENT_PRESETS } from '@/styles/themeTokens'
import { Sun, Moon, Laptop, Check, Palette } from 'lucide-react'
import { clsx } from 'clsx'

export const ThemeSettings: React.FC = () => {
  const { theme, accent, customHex, setTheme, setAccent } = useThemeStore()
  const updatePreferences = useAuthStore((state) => state.updatePreferences)
  const [hexInput, setHexInput] = useState(customHex || '#0d9488')
  const [showHexInput, setShowHexInput] = useState(accent === 'custom')

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    updatePreferences({ themePreference: newTheme })
  }

  const handleAccentChange = (accentId: string, customHexVal?: string) => {
    setAccent(accentId, customHexVal)
    updatePreferences({ accentColor: accentId, customAccentHex: customHexVal })
    if (accentId !== 'custom') {
      setShowHexInput(false)
    }
  }

  const handleCustomHexSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
      handleAccentChange('custom', hexInput)
    }
  }

  return (
    <Card className="p-5 border-border/70 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-foreground">Theme &amp; Appearance</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Customize lighting mode and brand accent palette
        </p>
      </div>

      {/* Theme Mode Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
          Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Laptop },
          ].map((t) => {
            const Icon = t.icon
            const isSelected = theme === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id as ThemeMode)}
                className={clsx(
                  'flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all select-none',
                  isSelected
                    ? 'bg-primary/10 text-primary border-primary font-bold shadow-sm'
                    : 'bg-card text-muted-foreground border-border/60 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Accent Color Palette */}
      <div className="space-y-2 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-foreground/80 uppercase tracking-wide">
            Accent Color
          </label>
          <button
            type="button"
            onClick={() => setShowHexInput(!showHexInput)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <Palette className="h-3 w-3" />
            <span>{showHexInput ? 'Presets' : 'Custom Hex'}</span>
          </button>
        </div>

        {!showHexInput ? (
          <div className="grid grid-cols-3 xs:grid-cols-6 gap-2 xs:gap-2.5">
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = accent === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAccentChange(preset.id)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center min-h-[58px]',
                    isSelected
                      ? 'border-foreground font-bold shadow-sm scale-105 bg-muted/40'
                      : 'border-border/60 hover:bg-muted/30'
                  )}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: preset.colorHex }}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white stroke-[3]" />}
                  </div>
                  <span className="text-[11px] font-medium text-foreground truncate w-full">
                    {preset.name.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <form onSubmit={handleCustomHexSubmit} className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center">
            <div className="flex-1 min-w-0">
              <Input
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                placeholder="#0d9488"
                className="font-mono uppercase text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shrink-0 shadow-sm min-h-[42px] flex items-center justify-center"
            >
              Apply Hex
            </button>
          </form>
        )}
      </div>
    </Card>
  )
}
