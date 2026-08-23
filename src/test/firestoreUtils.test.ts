import { describe, it, expect } from 'vitest'
import { sanitizeForFirestore } from '@/utils/firestoreUtils'

describe('Firestore Sanitizer (sanitizeForFirestore)', () => {
  it('removes undefined fields from object without affecting other fields', () => {
    const raw = {
      id: 'exp_123',
      amountPaise: 18000,
      title: 'Dinner',
      note: undefined,
      tags: undefined,
      paymentMethod: 'UPI',
    }

    const cleaned = sanitizeForFirestore(raw)
    expect(cleaned).toEqual({
      id: 'exp_123',
      amountPaise: 18000,
      title: 'Dinner',
      paymentMethod: 'UPI',
    })
    expect('note' in cleaned).toBe(false)
    expect('tags' in cleaned).toBe(false)
  })

  it('handles nested objects and arrays', () => {
    const raw = {
      payerId: 'u1',
      payerSnapshot: {
        displayName: 'Aman',
        photoURL: undefined,
      },
      participants: {
        u1: { amountPaise: 100, note: undefined },
      },
      tags: ['food', undefined, 'dinner'],
    }

    const cleaned = sanitizeForFirestore(raw)
    expect(cleaned).toEqual({
      payerId: 'u1',
      payerSnapshot: {
        displayName: 'Aman',
      },
      participants: {
        u1: { amountPaise: 100 },
      },
      tags: ['food', 'dinner'],
    })
  })

  it('preserves null, boolean, zero, and string values', () => {
    const raw = {
      photoURL: null,
      budget: 0,
      isValid: false,
      title: '',
      note: undefined,
    }

    const cleaned = sanitizeForFirestore(raw)
    expect(cleaned).toEqual({
      photoURL: null,
      budget: 0,
      isValid: false,
      title: '',
    })
  })
})
