import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { formatINR, parseAmountInput } from '@/domain/money/money'
import { calculateEqualSplit, calculatePercentageSplit } from '@/domain/splits/splitCalculator'
import { ExpenseListItem } from '@/features/expenses/ExpenseListItem'
import { PersonalTransaction } from '@/types/expense'
import { ACCENT_PRESETS, applyAccentToDocument } from '@/styles/themeTokens'

describe('Responsive Design & Large Numbers Audit', () => {
  describe('Indian Rupee Formatting & Numerical Stress Tests', () => {
    it('correctly formats small decimal amounts without precision loss', () => {
      expect(formatINR(1)).toBe('₹0.01')
      expect(formatINR(50)).toBe('₹0.50')
      expect(formatINR(100)).toBe('₹1')
      expect(formatINR(99999)).toBe('₹999.99')
    })

    it('correctly formats intermediate and large amounts with Indian number system commas', () => {
      expect(formatINR(1250050)).toBe('₹12,500.50')
      expect(formatINR(12500000)).toBe('₹1,25,000')
      expect(formatINR(10000000)).toBe('₹1,00,000')
      expect(formatINR(100000000)).toBe('₹10,00,000')
      expect(formatINR(999999999)).toBe('₹99,99,999.99')
      expect(formatINR(1000000000)).toBe('₹1,00,00,000')
    })

    it('formats compact representations correctly for dashboards and charts', () => {
      expect(formatINR(150000, { compact: true })).toBe('₹1.5k')
      expect(formatINR(25000000, { compact: true })).toBe('₹2.50 L')
      expect(formatINR(1500000000, { compact: true })).toBe('₹1.50 Cr')
    })

    it('correctly parses user numeric inputs with commas and currency symbols', () => {
      expect(parseAmountInput('₹180.50')).toBe(18050)
      expect(parseAmountInput('1,25,000')).toBe(12500000)
      expect(parseAmountInput('99,99,999.99')).toBe(999999999)
      expect(parseAmountInput('0.01')).toBe(1)
    })
  })

  describe('Multi-Participant Split Calculator Scaling (2 to 20+ members)', () => {
    it('handles 2-participant equal split with odd paise remainder distribution', () => {
      const shares = calculateEqualSplit(10001, ['user1', 'user2'])
      expect(shares['user1'] + shares['user2']).toBe(10001)
      expect(shares['user1']).toBe(5001)
      expect(shares['user2']).toBe(5000)
    })

    it('handles 7-participant equal split with exact paise conservation', () => {
      const memberIds = Array.from({ length: 7 }, (_, i) => `user_${i + 1}`)
      const totalPaise = 100000
      const shares = calculateEqualSplit(totalPaise, memberIds)
      const sum = Object.values(shares).reduce((a, b) => a + b, 0)
      expect(sum).toBe(totalPaise)
    })

    it('handles 25-participant large group split with exact sum matching', () => {
      const memberIds = Array.from({ length: 25 }, (_, i) => `member_${i + 1}`)
      const totalPaise = 567890
      const shares = calculateEqualSplit(totalPaise, memberIds)
      const sum = Object.values(shares).reduce((a, b) => a + b, 0)
      expect(sum).toBe(totalPaise)
      const floorVal = Math.floor(totalPaise / 25)
      Object.values(shares).forEach((val) => {
        expect(val === floorVal || val === floorVal + 1).toBe(true)
      })
    })

    it('handles percentage split validation across varied weights', () => {
      const result = calculatePercentageSplit(10000, {
        user1: 33.33,
        user2: 33.33,
        user3: 33.34,
      })
      expect(result.isValid).toBe(true)
      const sum = Object.values(result.shares).reduce((a, b) => a + b, 0)
      expect(sum).toBe(10000)
    })
  })

  describe('Content Stress Testing with Long Strings in UI Components', () => {
    it('renders ExpenseListItem with extreme long title, category, and monetary amount without error', () => {
      const extremeExpense: PersonalTransaction = {
        id: 'exp_extreme_1',
        userId: 'usr_1',
        amountPaise: 999999999,
        category: 'Shopping', type: 'EXPENSE',
        title: 'Dinner with roommates after the engineering project meeting and farewell celebration',
        date: '2026-08-23',
        paymentMethod: 'UPI',
        note: 'Extremely detailed invoice note for laptop parts, adapters, cables, and monitors',
        isGroupExpense: true,
        groupId: 'grp_1',
        groupName: 'Goa Trip With College Friends Summer Vacation 2026',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      render(
        <MemoryRouter>
          <ExpenseListItem expense={extremeExpense} />
        </MemoryRouter>
      )

      expect(screen.getByText(/Dinner with roommates/i)).toBeDefined()
      expect(screen.getByText(/Goa Trip With College Friends/i)).toBeDefined()
      expect(screen.getByText(/₹99,99,999.99/i)).toBeDefined()
    })
  })

  describe('Theme Contrast & Accent Token Stability', () => {
    it('provides valid HSL tokens for all preset themes in both light and dark modes', () => {
      ACCENT_PRESETS.forEach((preset) => {
        expect(preset.hsl.light.primary).toBeDefined()
        expect(preset.hsl.dark.primary).toBeDefined()
        expect(preset.colorHex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })

    it('successfully applies custom hex accent colors without document error', () => {
      expect(() => {
        applyAccentToDocument('custom', '#6366f1', false)
        applyAccentToDocument('custom', '#6366f1', true)
      }).not.toThrow()
    })
  })
})
