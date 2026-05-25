export type { Result } from './shared/result'
export { ok, err } from './shared/result'
export type {
  Brand,
  UserId,
  ConversationId,
  MessageId,
  PostId,
  ReplyId,
  CandleId,
} from './shared/id'
export { DomainError, NotFoundError, ValidationError, ForbiddenError } from './shared/errors'
export type { NightId } from './shared/time'
export {
  isOpen,
  nightIdOf,
  currentNightId,
  opensAtOf,
  closesAtOf,
  closedReason,
} from './shared/time'
export type { User, PresenceVisibility, SignTag, Tone, CreateUserInput } from './user/user'
export { createUser, isSignTag, SIGN_TAGS, TONES } from './user/user'
export type { UserRepository } from './user/repository'
export type { Conversation, CreateConversationInput } from './conversation/conversation'
export { createConversation, normalizeParticipants } from './conversation/conversation'
export type { ConversationRepository } from './conversation/repository'
export type { Message, CreateMessageInput } from './message/message'
export { createMessage, markAsRead, markAsDeleted } from './message/message'
export type { MessageRepository, ListMessagesQuery } from './message/repository'
