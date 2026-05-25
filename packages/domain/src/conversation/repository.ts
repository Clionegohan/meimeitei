import type { ConversationId, PostId, UserId } from '../shared/id'
import type { Conversation } from './conversation'

// ConversationRepository は domain layer の port。
// `(participantIds の正規化ペア, rootPostId)` の unique 制約は本 interface の契約として
// implementer が保証する。`findByPair` は既存 conversation の解決に使う（R2 再利用判定）。
export interface ConversationRepository {
  findById(id: ConversationId): Promise<Conversation | null>
  findByPair(
    participants: readonly [UserId, UserId],
    rootPostId: PostId | null,
  ): Promise<Conversation | null>
  save(conv: Conversation): Promise<void>
  listByUser(userId: UserId): Promise<readonly Conversation[]>
}
