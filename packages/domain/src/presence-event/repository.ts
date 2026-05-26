import type { UserId } from '../shared/id'
import type { PresenceEvent } from './presence-event'

// PresenceEventRepository — append-only log of presence transitions per user.
//
// `listByUserInWindow` returns events whose `occurredAt` is in `[from, to)`,
// ordered ascending by `occurredAt`.
export interface PresenceEventRepository {
  record(event: PresenceEvent): Promise<void>
  listByUserInWindow(
    userId: UserId,
    from: Date,
    to: Date,
  ): Promise<readonly PresenceEvent[]>
}
