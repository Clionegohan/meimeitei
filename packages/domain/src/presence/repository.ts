import type { UserId } from '../shared/id'
import type { Presence } from './presence'

// PresenceRepository は domain layer の port。揮発（in-memory）実装が前提。
// 取得時の「秘匿フィルタ」は entity の visibleStatusTo に委ねるので、repository は
// 生のデータを返す。
export interface PresenceRepository {
  findByUser(userId: UserId): Promise<Presence | null>
  set(presence: Presence): Promise<void>
  // 「灯ともる羊」UI 用。生 (online のみ) を返す。
  listOnline(): Promise<readonly Presence[]>
}
