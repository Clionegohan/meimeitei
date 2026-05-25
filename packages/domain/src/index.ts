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
