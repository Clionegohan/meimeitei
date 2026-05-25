import type { UserId } from '../shared/id'
import type { PresenceVisibility } from '../user/user'

export type PresenceStatus = 'online' | 'offline'

// Presence は揮発（in-memory のみ、永続化しない）。
// 「灯ともる」UI 表記の根拠データ。Socket.IO 接続 / 切断で更新される想定。
export type Presence = {
  readonly userId: UserId
  readonly status: PresenceStatus
  readonly lastSeenAt: Date
}

export type CreatePresenceInput = {
  userId: UserId
  status: PresenceStatus
  lastSeenAt: Date
}

export const createPresence = (input: CreatePresenceInput): Presence => ({
  userId: input.userId,
  status: input.status,
  lastSeenAt: input.lastSeenAt,
})

// 完全非対称 stealth.
//   - visible owner: viewer は実 status を見える
//   - invisible owner: 他者からは offline、本人は実 status を見える
export const visibleStatusTo = (
  presence: Presence,
  ctx: { ownerVisibility: PresenceVisibility; viewerIsOwner: boolean },
): PresenceStatus => {
  if (ctx.viewerIsOwner) return presence.status
  if (ctx.ownerVisibility === 'invisible') return 'offline'
  return presence.status
}
