import { describe, expect, it } from 'vitest'
import { ValidationError } from './errors'
import {
  closedReason,
  closesAtOf,
  currentNightId,
  isOpen,
  nightIdOf,
  opensAtOf,
  type NightId,
} from './time'

// helper: build a Date that represents the given wall clock in JST.
const jst = (y: number, m: number, d: number, h: number, min = 0, s = 0): Date =>
  new Date(Date.UTC(y, m - 1, d, h - 9, min, s))

describe('isOpen', () => {
  it('open at 22:00 JST sharp', () => {
    expect(isOpen(jst(2026, 5, 25, 22, 0))).toBe(true)
  })
  it('open at 23:59 JST', () => {
    expect(isOpen(jst(2026, 5, 25, 23, 59))).toBe(true)
  })
  it('open at 00:00 JST next day', () => {
    expect(isOpen(jst(2026, 5, 26, 0, 0))).toBe(true)
  })
  it('open at 04:59 JST', () => {
    expect(isOpen(jst(2026, 5, 26, 4, 59, 59))).toBe(true)
  })
  it('closed at 05:00 JST sharp', () => {
    expect(isOpen(jst(2026, 5, 26, 5, 0))).toBe(false)
  })
  it('closed at noon JST', () => {
    expect(isOpen(jst(2026, 5, 25, 12, 0))).toBe(false)
  })
  it('closed at 21:59 JST', () => {
    expect(isOpen(jst(2026, 5, 25, 21, 59))).toBe(false)
  })
})

describe('nightIdOf', () => {
  it('22:00 JST belongs to that day', () => {
    expect(nightIdOf(jst(2026, 5, 25, 22, 0))).toBe('2026-05-25')
  })
  it('23:30 JST belongs to that day', () => {
    expect(nightIdOf(jst(2026, 5, 25, 23, 30))).toBe('2026-05-25')
  })
  it('00:00 JST belongs to previous day night', () => {
    expect(nightIdOf(jst(2026, 5, 26, 0, 0))).toBe('2026-05-25')
  })
  it('04:59 JST belongs to previous day night', () => {
    expect(nightIdOf(jst(2026, 5, 26, 4, 59))).toBe('2026-05-25')
  })
  it('throws at 05:00 JST (closing edge)', () => {
    expect(() => nightIdOf(jst(2026, 5, 26, 5, 0))).toThrow(ValidationError)
  })
  it('throws at 21:59 JST', () => {
    expect(() => nightIdOf(jst(2026, 5, 25, 21, 59))).toThrow(ValidationError)
  })
  it('handles month boundary (last day of month)', () => {
    // 2026-05-01 00:30 JST → previous night = 2026-04-30
    expect(nightIdOf(jst(2026, 5, 1, 0, 30))).toBe('2026-04-30')
  })
  it('handles year boundary', () => {
    // 2027-01-01 02:00 JST → previous night = 2026-12-31
    expect(nightIdOf(jst(2027, 1, 1, 2, 0))).toBe('2026-12-31')
  })
})

describe('currentNightId', () => {
  it('returns null outside business hours', () => {
    expect(currentNightId(jst(2026, 5, 25, 12, 0))).toBeNull()
  })
  it('returns night during business hours', () => {
    expect(currentNightId(jst(2026, 5, 26, 2, 0))).toBe('2026-05-25')
  })
})

describe('opensAtOf / closesAtOf', () => {
  const night = '2026-05-25' as NightId

  it('opens at 22:00 JST of the night day (= 13:00Z)', () => {
    expect(opensAtOf(night).toISOString()).toBe('2026-05-25T13:00:00.000Z')
  })
  it('closes at 05:00 JST of next day (= 20:00Z of night day)', () => {
    expect(closesAtOf(night).toISOString()).toBe('2026-05-25T20:00:00.000Z')
  })
  it('opens and closes span exactly 7 hours', () => {
    const span = closesAtOf(night).getTime() - opensAtOf(night).getTime()
    expect(span).toBe(7 * 60 * 60 * 1000)
  })
  it('rejects invalid nightId', () => {
    expect(() => opensAtOf('bogus' as NightId)).toThrow(ValidationError)
  })
})

describe('closedReason', () => {
  it('null while open', () => {
    expect(closedReason(jst(2026, 5, 26, 2, 0))).toBeNull()
  })
  it('after-close at 05:00 JST', () => {
    expect(closedReason(jst(2026, 5, 26, 5, 0))).toBe('after-close')
  })
  it('after-close at 10:00 JST', () => {
    expect(closedReason(jst(2026, 5, 25, 10, 0))).toBe('after-close')
  })
  it('before-open at 14:00 JST (boundary)', () => {
    expect(closedReason(jst(2026, 5, 25, 14, 0))).toBe('before-open')
  })
  it('before-open at 21:59 JST', () => {
    expect(closedReason(jst(2026, 5, 25, 21, 59))).toBe('before-open')
  })
  it('after-close at 13:59 JST (boundary)', () => {
    expect(closedReason(jst(2026, 5, 25, 13, 59))).toBe('after-close')
  })
})
