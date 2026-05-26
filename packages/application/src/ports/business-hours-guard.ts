import { ForbiddenError, isOpen } from '@me-me-en/domain'
import type { Clock } from './clock'

// BusinessHoursGuard — gates use cases on the business window (22:00-05:00 JST).
// Throws ForbiddenError from @me-me-en/domain when outside.
// Each call re-reads the clock, so a long-lived guard stays accurate.
export interface BusinessHoursGuard {
  ensureOpen(): void
}

export const createBusinessHoursGuard = (clock: Clock): BusinessHoursGuard => ({
  ensureOpen: (): void => {
    if (!isOpen(clock.now())) {
      throw new ForbiddenError('outside business hours (22:00-05:00 JST)')
    }
  },
})
