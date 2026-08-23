import { describe, it, expect } from 'vitest'
import { parseQuickExpenseInput } from '@/domain/expenses/heuristicParser'

describe('Heuristic Quick Expense Parser', () => {
  it('parses "180 food" correctly', () => {
    const res = parseQuickExpenseInput('180 food')
    expect(res.amountPaise).toBe(18000)
    expect(res.category).toBe('Food')
    expect(res.title).toBe('Food')
  })

  it('parses "180 dinner" correctly', () => {
    const res = parseQuickExpenseInput('180 dinner')
    expect(res.amountPaise).toBe(18000)
    expect(res.category).toBe('Food')
    expect(res.title).toBe('Dinner')
  })

  it('parses "₹250 uber to college" correctly', () => {
    const res = parseQuickExpenseInput('₹250 uber to college')
    expect(res.amountPaise).toBe(25000)
    expect(res.category).toBe('Travel')
    expect(res.title).toBe('Uber to college')
  })

  it('parses "movie 450 with rahul" correctly', () => {
    const res = parseQuickExpenseInput('movie 450 with rahul')
    expect(res.amountPaise).toBe(45000)
    expect(res.category).toBe('Entertainment')
    expect(res.title).toBe('Movie with rahul')
  })

  it('handles empty input gracefully', () => {
    const res = parseQuickExpenseInput('')
    expect(res.amountPaise).toBeNull()
    expect(res.confidence).toBe(0)
  })
})
