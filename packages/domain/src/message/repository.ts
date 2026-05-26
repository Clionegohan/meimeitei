import type { ConversationId, MessageId } from '../shared/id'
import type { Message } from './message'

export type ListMessagesQuery = {
  conversationId: ConversationId
  // Cursor-based pagination: fetch messages strictly before this timestamp.
  before?: Date
  // Cap result size. Implementer chooses a default if omitted.
  limit?: number
}

// MessageRepository は domain layer の port。
// 並び順は implementer の契約: ascending by sentAt（古い順、chat 慣例）。
// pagination は cursor-based を採用（offset は使わない）。
export interface MessageRepository {
  findById(id: MessageId): Promise<Message | null>
  save(message: Message): Promise<void>
  listByConversation(query: ListMessagesQuery): Promise<readonly Message[]>
  // Returns a count of messages per conversation in the half-open window
  // `[from, to)`. Conversations not in the input keys map to 0. Used by the
  // "close sheep" stats — bulk shape is intentional so Postgres can do a
  // single `WHERE conversation_id = ANY($ids) AND sent_at >= $from AND sent_at < $to`
  // grouped query instead of N round trips.
  countByConversationsInWindow(
    conversationIds: readonly ConversationId[],
    from: Date,
    to: Date,
  ): Promise<ReadonlyMap<ConversationId, number>>
}
