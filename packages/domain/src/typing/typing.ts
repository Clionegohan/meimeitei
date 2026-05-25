import type { ConversationId, UserId } from '../shared/id'

// Typing TTL: 5 seconds. Past this, the indicator should be cleared.
export const TYPING_TTL_MS = 5_000

export type Typing = {
  readonly conversationId: ConversationId
  readonly userId: UserId
  readonly startedAt: Date
}

export type CreateTypingInput = {
  conversationId: ConversationId
  userId: UserId
  startedAt: Date
}

export const createTyping = (input: CreateTypingInput): Typing => ({
  conversationId: input.conversationId,
  userId: input.userId,
  startedAt: input.startedAt,
})

// Inclusive at the boundary (>= TTL means expired).
export const hasExpired = (typing: Typing, now: Date): boolean =>
  now.getTime() - typing.startedAt.getTime() >= TYPING_TTL_MS
