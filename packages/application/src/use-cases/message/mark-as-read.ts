import {
  ForbiddenError,
  markAsRead as markAsReadEntity,
  NotFoundError,
  type ConversationRepository,
  type Message,
  type MessageId,
  type MessageRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'

export type MarkAsReadDeps = {
  conversationRepository: ConversationRepository
  messageRepository: MessageRepository
  clock: Clock
  businessHoursGuard: BusinessHoursGuard
}

export type MarkAsReadInput = {
  readerId: UserId
  messageId: MessageId
}

export type MarkAsRead = (input: MarkAsReadInput) => Promise<Message>

export const createMarkAsRead = (deps: MarkAsReadDeps): MarkAsRead => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  const msg = await deps.messageRepository.findById(input.messageId)
  if (msg === null) {
    throw new NotFoundError(`message ${input.messageId} not found`)
  }

  const conv = await deps.conversationRepository.findById(msg.conversationId)
  if (conv === null) {
    throw new NotFoundError(`conversation ${msg.conversationId} not found`)
  }

  if (!conv.participantIds.includes(input.readerId)) {
    throw new ForbiddenError('reader is not a participant of this conversation')
  }

  // markAsReadEntity is idempotent: returns the same instance if already read.
  const updated = markAsReadEntity(msg, deps.clock.now())
  if (updated !== msg) {
    await deps.messageRepository.save(updated)
  }
  return updated
}
