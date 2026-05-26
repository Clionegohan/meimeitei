import {
  createPresence,
  type Presence,
  type PresenceRepository,
  type PresenceStatus,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'

export type UpdatePresenceDeps = {
  presenceRepository: PresenceRepository
  clock: Clock
  businessHoursGuard: BusinessHoursGuard
}

export type UpdatePresenceInput = {
  userId: UserId
  status: PresenceStatus
}

export type UpdatePresence = (input: UpdatePresenceInput) => Promise<Presence>

export const createUpdatePresence = (deps: UpdatePresenceDeps): UpdatePresence => async (
  input,
) => {
  deps.businessHoursGuard.ensureOpen()
  const presence = createPresence({
    userId: input.userId,
    status: input.status,
    lastSeenAt: deps.clock.now(),
  })
  await deps.presenceRepository.set(presence)
  return presence
}
