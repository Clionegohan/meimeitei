import {
  currentNightId,
  type LoginHistoryRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'

export type RecordLoginDeps = {
  loginHistoryRepository: LoginHistoryRepository
  clock: Clock
  businessHoursGuard: BusinessHoursGuard
}

export type RecordLoginInput = { userId: UserId }

export type RecordLogin = (input: RecordLoginInput) => Promise<void>

// Called when a user enters the app during business hours. Idempotent
// per (user, night) — the repository records only the first call of the
// night and keeps the firstSeenAt for later analysis.
export const createRecordLogin = (deps: RecordLoginDeps): RecordLogin => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const now = deps.clock.now()
  const nightId = currentNightId(now)
  if (nightId === null) return
  await deps.loginHistoryRepository.recordIfFirstOfNight(input.userId, nightId, now)
}
