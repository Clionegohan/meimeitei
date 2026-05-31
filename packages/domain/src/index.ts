export type { Result } from './shared/result'
export { ok, err } from './shared/result'
export type { Brand, UserId, ConversationId, MessageId, PostId, LikeId, BlockId } from './shared/id'
export {
  DomainError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  RateLimitError,
} from './shared/errors'
export type { NightId } from './shared/time'
export {
  isOpen,
  nightIdOf,
  currentNightId,
  opensAtOf,
  closesAtOf,
  closedReason,
  nextCloseAfter,
} from './shared/time'
export type {
  User,
  PresenceVisibility,
  SignTag,
  Tone,
  FavoriteMoon,
  CreateUserInput,
} from './user/user'
export {
  createUser,
  isSignTag,
  isFavoriteMoon,
  SIGN_TAGS,
  TONES,
  FAVORITE_MOONS,
} from './user/user'
export type { UserRepository } from './user/repository'
export type { Conversation, CreateConversationInput } from './conversation/conversation'
export { createConversation, normalizeParticipants } from './conversation/conversation'
export type { ConversationRepository } from './conversation/repository'
export type { Message, CreateMessageInput } from './message/message'
export { createMessage, markAsRead, markAsDeleted } from './message/message'
export type { MessageRepository, ListMessagesQuery } from './message/repository'
export type { Post, CreatePostInput } from './post/post'
export { createPost, markPostAsDeleted } from './post/post'
export type { PostRepository, ListPostsQuery } from './post/repository'
export type { Like, CreateLikeInput } from './like/like'
export { createLike } from './like/like'
export type { LikeRepository } from './like/repository'
export type { Block, CreateBlockInput } from './block/block'
export { createBlock } from './block/block'
export type { BlockRepository } from './block/repository'
export type { Presence, PresenceStatus, CreatePresenceInput } from './presence/presence'
export { createPresence, visibleStatusTo } from './presence/presence'
export type { PresenceRepository } from './presence/repository'
export type { Typing, CreateTypingInput } from './typing/typing'
export { createTyping, hasExpired, TYPING_TTL_MS } from './typing/typing'
export type { TypingRepository } from './typing/repository'
export type { LoginRecord, CreateLoginRecordInput } from './login-history/login-history'
export { createLoginRecord } from './login-history/login-history'
export type { LoginHistoryRepository } from './login-history/repository'
export type {
  PresenceEvent,
  PresenceEventType,
  CreatePresenceEventInput,
} from './presence-event/presence-event'
export { createPresenceEvent } from './presence-event/presence-event'
export type { PresenceEventRepository } from './presence-event/repository'
export type { AuthIdentity } from './auth-identity/auth-identity'
export type { AuthIdentityRepository } from './auth-identity/repository'
