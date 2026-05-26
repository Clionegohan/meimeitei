import {
  createPresenceEvent,
  type PresenceEventRepository,
  type PresenceEventType,
  type UserId,
} from '@me-me-en/domain'
import type { Clock } from '../../ports/clock'

// Note: NO BusinessHoursGuard. We want to record disconnect events at
// the closing edge (05:00 JST) when the server force-disconnects clients;
// the gating happens elsewhere.
export type RecordPresenceEventDeps = {
  presenceEventRepository: PresenceEventRepository
  clock: Clock
}

export type RecordPresenceEventInput = {
  userId: UserId
  type: PresenceEventType
}

export type RecordPresenceEvent = (input: RecordPresenceEventInput) => Promise<void>

export const createRecordPresenceEvent = (
  deps: RecordPresenceEventDeps,
): RecordPresenceEvent => async (input) => {
  const event = createPresenceEvent({
    userId: input.userId,
    type: input.type,
    occurredAt: deps.clock.now(),
  })
  await deps.presenceEventRepository.record(event)
}
