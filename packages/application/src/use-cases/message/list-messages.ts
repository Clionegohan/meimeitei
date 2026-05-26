import {
  ForbiddenError,
  NotFoundError,
  type ConversationId,
  type ConversationRepository,
  type ListMessagesQuery,
  type Message,
  type MessageRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type ListMessagesDeps = {
  conversationRepository: ConversationRepository
  messageRepository: MessageRepository
  businessHoursGuard: BusinessHoursGuard
}

export type ListMessagesInput = {
  viewerId: UserId
  conversationId: ConversationId
  before?: Date
  limit?: number
}

export type ListMessages = (input: ListMessagesInput) => Promise<readonly Message[]>

export const createListMessages = (deps: ListMessagesDeps): ListMessages => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  const conv = await deps.conversationRepository.findById(input.conversationId)
  if (conv === null) {
    throw new NotFoundError(`conversation ${input.conversationId} not found`)
  }
  if (!conv.participantIds.includes(input.viewerId)) {
    throw new ForbiddenError('viewer is not a participant of this conversation')
  }

  const query: ListMessagesQuery = { conversationId: input.conversationId }
  if (input.before !== undefined) query.before = input.before
  if (input.limit !== undefined) query.limit = input.limit
  return deps.messageRepository.listByConversation(query)
}
