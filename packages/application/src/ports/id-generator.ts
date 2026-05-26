import type {
  BlockId,
  ConversationId,
  LikeId,
  MessageId,
  PostId,
  UserId,
} from '@me-me-en/domain'

// IdGenerator port — produces branded ids for each entity type.
// Production: systemIdGenerator (uuid v4). Tests: deterministic sequential.
export interface IdGenerator {
  user(): UserId
  conversation(): ConversationId
  message(): MessageId
  post(): PostId
  like(): LikeId
  block(): BlockId
}

const uuid = (): string => globalThis.crypto.randomUUID()

export const systemIdGenerator: IdGenerator = {
  user: () => uuid() as UserId,
  conversation: () => uuid() as ConversationId,
  message: () => uuid() as MessageId,
  post: () => uuid() as PostId,
  like: () => uuid() as LikeId,
  block: () => uuid() as BlockId,
}
