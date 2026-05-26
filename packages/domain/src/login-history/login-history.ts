import type { UserId } from '../shared/id'
import type { NightId } from '../shared/time'

// 1-夜単位で「灯った」ユーザーを記録するための entity。
// 同じ夜に何度ログインしても LoginRecord は 1 件（idempotent on repository.recordIfFirstOfNight）。
export type LoginRecord = {
  readonly userId: UserId
  readonly nightId: NightId
  readonly firstSeenAt: Date
}

export type CreateLoginRecordInput = {
  userId: UserId
  nightId: NightId
  at: Date
}

export const createLoginRecord = (input: CreateLoginRecordInput): LoginRecord => ({
  userId: input.userId,
  nightId: input.nightId,
  firstSeenAt: input.at,
})
