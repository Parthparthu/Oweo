import { describe, it, expect } from 'vitest'
import {
  calculateEqualSplit,
  validateCustomSplit,
  calculatePercentageSplit,
} from '@/domain/splits/splitCalculator'

describe('Split Calculator Engine', () => {
  it('calculates equal split with exact 4-way division', () => {
    const totalPaise = 80000 // ₹800
    const participants = ['u1', 'u2', 'u3', 'u4']
    const result = calculateEqualSplit(totalPaise, participants)

    expect(result['u1']).toBe(20000)
    expect(result['u2']).toBe(20000)
    expect(result['u3']).toBe(20000)
    expect(result['u4']).toBe(20000)

    const sum = Object.values(result).reduce((a, b) => a + b, 0)
    expect(sum).toBe(80000)
  })

  it('handles 3-way odd split with zero remainder loss', () => {
    const totalPaise = 10000 // ₹100
    const participants = ['u1', 'u2', 'u3']
    const result = calculateEqualSplit(totalPaise, participants)

    // 10000 / 3 = 3333 with 1 remainder -> u1 gets 3334, u2 gets 3333, u3 gets 3333
    expect(result['u1']).toBe(3334)
    expect(result['u2']).toBe(3333)
    expect(result['u3']).toBe(3333)

    const sum = Object.values(result).reduce((a, b) => a + b, 0)
    expect(sum).toBe(10000)
  })

  it('handles 7-way split with exact remainder conservation', () => {
    const totalPaise = 10000 // ₹100
    const participants = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7']
    const result = calculateEqualSplit(totalPaise, participants)

    // 10000 / 7 = 1428 with remainder 4 -> u1..u4 get 1429, u5..u7 get 1428
    expect(result['u1']).toBe(1429)
    expect(result['u2']).toBe(1429)
    expect(result['u3']).toBe(1429)
    expect(result['u4']).toBe(1429)
    expect(result['u5']).toBe(1428)
    expect(result['u6']).toBe(1428)
    expect(result['u7']).toBe(1428)

    const sum = Object.values(result).reduce((a, b) => a + b, 0)
    expect(sum).toBe(10000)
  })

  it('handles empty participants or zero total gracefully', () => {
    expect(calculateEqualSplit(0, ['u1'])).toEqual({})
    expect(calculateEqualSplit(1000, [])).toEqual({})
  })

  it('validates custom exact amount split', () => {
    const totalPaise = 80000 // ₹800
    const validShares = {
      u1: 30000, // ₹300
      u2: 20000, // ₹200
      u3: 15000, // ₹150
      u4: 15000, // ₹150
    }

    const validRes = validateCustomSplit(totalPaise, validShares)
    expect(validRes.isValid).toBe(true)

    const invalidShares = {
      u1: 30000,
      u2: 20000,
      u3: 15000,
      // Total 65000 instead of 80000
    }

    const invalidRes = validateCustomSplit(totalPaise, invalidShares)
    expect(invalidRes.isValid).toBe(false)
    expect(invalidRes.discrepancyPaise).toBe(15000)

    const negativeRes = validateCustomSplit(totalPaise, { u1: -100, u2: 80100 })
    expect(negativeRes.isValid).toBe(false)
    expect(negativeRes.errorMessage).toContain('negative')
  })

  it('calculates and validates percentage split with exact sum matching', () => {
    const totalPaise = 100000 // ₹1,000
    const percentages = {
      u1: 40,
      u2: 30,
      u3: 20,
      u4: 10,
    }

    const res = calculatePercentageSplit(totalPaise, percentages)
    expect(res.isValid).toBe(true)
    expect(res.shares['u1']).toBe(40000)
    expect(res.shares['u2']).toBe(30000)
    expect(res.shares['u3']).toBe(20000)
    expect(res.shares['u4']).toBe(10000)

    const sum = Object.values(res.shares).reduce((a, b) => a + b, 0)
    expect(sum).toBe(100000)
  })

  it('handles percentage split with fractional remainder using Largest Remainder Method', () => {
    const totalPaise = 10000 // ₹100
    const percentages = {
      u1: 33.33,
      u2: 33.33,
      u3: 33.34,
    }

    const res = calculatePercentageSplit(totalPaise, percentages)
    expect(res.isValid).toBe(true)
    const sum = Object.values(res.shares).reduce((a, b) => a + b, 0)
    expect(sum).toBe(10000)
  })

  it('rejects invalid percentages that do not sum to 100% or contain negatives', () => {
    const totalPaise = 100000
    const percentages = {
      u1: 40,
      u2: 30,
      // total = 70%
    }

    const res = calculatePercentageSplit(totalPaise, percentages)
    expect(res.isValid).toBe(false)
    expect(res.errorMessage).toContain('30.0% remaining')

    const negRes = calculatePercentageSplit(totalPaise, { u1: -10, u2: 110 })
    expect(negRes.isValid).toBe(false)
    expect(negRes.errorMessage).toContain('negative')

    const overRes = calculatePercentageSplit(totalPaise, { u1: 110 })
    expect(overRes.isValid).toBe(false)
    expect(overRes.errorMessage).toContain('exceed 100%')
  })
})
