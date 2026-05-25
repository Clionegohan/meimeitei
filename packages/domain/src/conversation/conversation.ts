import { ValidationError } from '../shared/errors'
import type { ConversationId, PostId, UserId } from '../shared/id'

export type Conversation = {
  readonly id: ConversationId
  readonly participantIds: readonly [UserId, UserId]
  readonly rootPostId: PostId | null
  readonly openedAt: Date
}

export type CreateConversationInput = {
  id: ConversationId
  participants: readonly [UserId, UserId]
  rootPostId: PostId | null
  openedAt: Date
}

// Normalize a pair of UserId into lex-ascending order.
// Throws on a self-pair (a == b), per spec: no self-conversation.
export const normalizeParticipants = (
  a: UserId,
  b: UserId,
): readonly [UserId, UserId] => {
  if (a === b) {
    throw new ValidationError('participants must be two distinct users')
  }
  return a < b ? [a, b] : [b, a]
}

export const createConversation = (input: CreateConversationInput): Conversation => {
  const [a, b] = input.participants
  const normalized = normalizeParticipants(a, b)
  return {
    id: input.id,
    participantIds: normalized,
    rootPostId: input.rootPostId,
    openedAt: input.openedAt,
  }
}
