import { describe, expect, it } from 'vitest'
import { ForbiddenError } from '@me-me-en/domain'
import type { Clock } from './clock'
import { createBusinessHoursGuard } from './business-hours-guard'

const fixedClock = (date: Date): Clock => ({ now: () => date })

// helper: build a Date representing the given JST wall clock
const jst = (y: number, m: number, d: number, h: number, min = 0): Date =>
  new Date(Date.UTC(y, m - 1, d, h - 9, min, 0))

describe('BusinessHoursGuard', () => {
  it('passes within business hours (02:00 JST)', () => {
    const guard = createBusinessHoursGuard(fixedClock(jst(2026, 5, 26, 2, 0)))
    expect(() => guard.ensureOpen()).not.toThrow()
  })

  it('throws ForbiddenError outside business hours (noon JST)', () => {
    const guard = createBusinessHoursGuard(fixedClock(jst(2026, 5, 25, 12, 0)))
    expect(() => guard.ensureOpen()).toThrow(ForbiddenError)
  })

  it('passes at 22:00 JST sharp (open edge)', () => {
    const guard = createBusinessHoursGuard(fixedClock(jst(2026, 5, 25, 22, 0)))
    expect(() => guard.ensureOpen()).not.toThrow()
  })

  it('passes at 04:59 JST (last open minute)', () => {
    const guard = createBusinessHoursGuard(fixedClock(jst(2026, 5, 26, 4, 59)))
    expect(() => guard.ensureOpen()).not.toThrow()
  })

  it('throws at 05:00 JST sharp (close edge)', () => {
    const guard = createBusinessHoursGuard(fixedClock(jst(2026, 5, 26, 5, 0)))
    expect(() => guard.ensureOpen()).toThrow(ForbiddenError)
  })

  it('re-evaluates each call against the live clock', () => {
    // mutable clock simulating passage from open -> close
    let current = jst(2026, 5, 26, 4, 59)
    const clock: Clock = { now: () => current }
    const guard = createBusinessHoursGuard(clock)

    expect(() => guard.ensureOpen()).not.toThrow()
    current = jst(2026, 5, 26, 5, 0)
    expect(() => guard.ensureOpen()).toThrow(ForbiddenError)
  })
})
