import { ValidationError } from '../shared/errors'
import type { ConversationId, MessageId, UserId } from '../shared/id'

export type Message = {
  readonly id: MessageId
  readonly conversationId: ConversationId
  readonly senderId: UserId
  readonly body: string
  readonly sentAt: Date
  readonly readAt: Date | null
  readonly deletedAt: Date | null
}

export type CreateMessageInput = {
  id: MessageId
  conversationId: ConversationId
  senderId: UserId
  body: string
  sentAt: Date
}

const BODY_MAX = 280
const graphemeLength = (s: string): number => [...s].length

export const createMessage = (input: CreateMessageInput): Message => {
  if (input.body.trim().length === 0) {
    throw new ValidationError('message body must not be empty')
  }
  if (graphemeLength(input.body) > BODY_MAX) {
    throw new ValidationError(`message body must be at most ${BODY_MAX} characters`)
  }
  return {
    id: input.id,
    conversationId: input.conversationId,
    senderId: input.senderId,
    body: input.body,
    sentAt: input.sentAt,
    readAt: null,
    deletedAt: null,
  }
}

// Idempotent mark-as-read. Returns the same instance if already read.
export const markAsRead = (msg: Message, readAt: Date): Message => {
  if (msg.readAt !== null) return msg
  return { ...msg, readAt }
}

// Idempotent mark-as-deleted (soft delete). body is preserved at this layer;
// the presentation layer is responsible for hiding it with the placeholder.
export const markAsDeleted = (msg: Message, deletedAt: Date): Message => {
  if (msg.deletedAt !== null) return msg
  return { ...msg, deletedAt }
}
