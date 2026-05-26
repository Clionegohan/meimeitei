import type { UserId } from '../shared/id'

// Time-stamped presence transitions, used as the source data for the
// 在席の刻 chart (hour-of-night distribution over the last N nights)
// and other derived stats.
export type PresenceEventType = 'online' | 'offline'

export type PresenceEvent = {
  readonly userId: UserId
  readonly type: PresenceEventType
  readonly occurredAt: Date
}

export type CreatePresenceEventInput = {
  userId: UserId
  type: PresenceEventType
  occurredAt: Date
}

export const createPresenceEvent = (
  input: CreatePresenceEventInput,
): PresenceEvent => ({
  userId: input.userId,
  type: input.type,
  occurredAt: input.occurredAt,
})
