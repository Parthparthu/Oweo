import { describe, it, expect } from 'vitest'
import { parseSplitwiseCSV, parseCSVLines } from '@/domain/importers/splitwiseParser'

describe('Splitwise CSV Parser', () => {
  it('correctly handles quoted lines with commas in description', () => {
    const csv = `Date,Description,Category,Cost,Currency,Group
2026-05-12,"Dinner at Mario's, Bangalore",Dining out,1850.50,INR,Goa Trip
2026-05-14,Groceries,Groceries,720.00,INR,Flatmates`

    const lines = parseCSVLines(csv)
    expect(lines).toHaveLength(3)
    expect(lines[1][1]).toBe("Dinner at Mario's, Bangalore")
    expect(lines[1][3]).toBe('1850.50')
  })

  it('parses Splitwise export with preview metadata, date ranges, and categories', () => {
    const csv = `Date,Description,Category,Cost,Currency,Group
2026-05-10,Airport Taxi,Transportation,1200.00,INR,Goa Trip
2026-05-12,Villa Booking,Rent,15000.00,INR,Goa Trip
2026-05-15,Swiggy Lunch,Dining out,450.00,INR,Flatmates`

    const preview = parseSplitwiseCSV(csv)

    expect(preview.errors).toHaveLength(0)
    expect(preview.validExpenses).toHaveLength(3)
    expect(preview.totalVolumePaise).toBe(120000 + 1500000 + 45000)
    expect(preview.detectedGroups).toEqual(['Goa Trip', 'Flatmates'])
    expect(preview.dateRange.start).toBe('2026-05-10')
    expect(preview.dateRange.end).toBe('2026-05-15')

    // Check category mappings
    expect(preview.validExpenses[0].category).toBe('Travel')
    expect(preview.validExpenses[1].category).toBe('Rent')
    expect(preview.validExpenses[2].category).toBe('Food')
  })

  it('handles empty or malformed CSV gracefully', () => {
    const emptyPreview = parseSplitwiseCSV('')
    expect(emptyPreview.errors.length).toBeGreaterThan(0)
    expect(emptyPreview.validExpenses).toHaveLength(0)

    const invalidHeaderPreview = parseSplitwiseCSV('Random,Column,Headers\n1,2,3')
    expect(invalidHeaderPreview.errors.length).toBeGreaterThan(0)
  })
})
