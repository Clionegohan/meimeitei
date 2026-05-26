import type { UserId } from '../shared/id'
import type { NightId } from '../shared/time'

// LoginHistoryRepository — domain port for tracking nights a user has logged in.
//
// recordIfFirstOfNight is idempotent: calling it multiple times in the same
// night for the same user must result in a single record.
// listNightsByUser returns the nights in descending order (newest first),
// without duplicates.
export interface LoginHistoryRepository {
  recordIfFirstOfNight(userId: UserId, nightId: NightId, at: Date): Promise<void>
  listNightsByUser(userId: UserId): Promise<readonly NightId[]>
}
