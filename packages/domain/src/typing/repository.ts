import type { ConversationId, UserId } from '../shared/id'
import type { Typing } from './typing'

// TypingRepository は domain layer の port。揮発実装が前提。
// 有効期限切れの自動掃除は implementer の責務（listActiveByConversation が
// expired を除外して返す）。
export interface TypingRepository {
  findByConversationAndUser(
    conversationId: ConversationId,
    userId: UserId,
  ): Promise<Typing | null>
  set(typing: Typing): Promise<void>
  clear(conversationId: ConversationId, userId: UserId): Promise<void>
  // `now` を渡して TTL 内のものだけ返す。
  listActiveByConversation(
    conversationId: ConversationId,
    now: Date,
  ): Promise<readonly Typing[]>
}
