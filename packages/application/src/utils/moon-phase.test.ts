import { describe, expect, it } from 'vitest'
import { getMoonPhase } from './moon-phase'

describe('getMoonPhase', () => {
  it('returns a value in [0, 1) regardless of input', () => {
    const samples = [
      new Date(0),
      new Date('1970-01-01T00:00:00Z'),
      new Date('2026-05-25T22:00:00+09:00'),
      new Date('2100-12-31T23:59:59Z'),
    ]
    for (const d of samples) {
      const phase = getMoonPhase(d)
      expect(phase).toBeGreaterThanOrEqual(0)
      expect(phase).toBeLessThan(1)
    }
  })

  it('returns ≈ 0 at the reference new moon (2000-01-06 18:14 UTC)', () => {
    const ref = new Date(Date.UTC(2000, 0, 6, 18, 14))
    const phase = getMoonPhase(ref)
    expect(phase).toBeCloseTo(0, 5)
  })

  it('returns ≈ 0.5 at the reference new moon + half a synodic month', () => {
    const halfCycleMs = ((29.5305882 / 2) * 24 * 60 * 60 * 1000)
    const ref = Date.UTC(2000, 0, 6, 18, 14)
    const phase = getMoonPhase(new Date(ref + halfCycleMs))
    expect(phase).toBeCloseTo(0.5, 3)
  })

  it('wraps around: ref + N synodic months ≈ 0', () => {
    const synodicMs = 29.5305882 * 24 * 60 * 60 * 1000
    const ref = Date.UTC(2000, 0, 6, 18, 14)
    for (const n of [1, 5, 12]) {
      const phase = getMoonPhase(new Date(ref + n * synodicMs))
      // Accept either close to 0 or close to 1 (the rollover boundary).
      const distanceToBoundary = Math.min(phase, 1 - phase)
      expect(distanceToBoundary).toBeLessThan(0.001)
    }
  })

  it('handles dates before the reference epoch', () => {
    const ref = Date.UTC(2000, 0, 6, 18, 14)
    const before = new Date(ref - 5 * 24 * 60 * 60 * 1000)
    const phase = getMoonPhase(before)
    expect(phase).toBeGreaterThanOrEqual(0)
    expect(phase).toBeLessThan(1)
  })
})
