import {
  createMessage,
  ForbiddenError,
  NotFoundError,
  type BlockRepository,
  type ConversationId,
  type ConversationRepository,
  type Message,
  type MessageRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'
import type { IdGenerator } from '../../ports/id-generator'

export type SendMessageDeps = {
  conversationRepository: ConversationRepository
  messageRepository: MessageRepository
  blockRepository: BlockRepository
  clock: Clock
  idGenerator: IdGenerator
  businessHoursGuard: BusinessHoursGuard
}

export type SendMessageInput = {
  senderId: UserId
  conversationId: ConversationId
  body: string
}

export type SendMessage = (input: SendMessageInput) => Promise<Message>

export const createSendMessage = (deps: SendMessageDeps): SendMessage => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  const conv = await deps.conversationRepository.findById(input.conversationId)
  if (conv === null) {
    throw new NotFoundError(`conversation ${input.conversationId} not found`)
  }

  if (!conv.participantIds.includes(input.senderId)) {
    throw new ForbiddenError('sender is not a participant of this conversation')
  }

  const counterpart = conv.participantIds.find((id) => id !== input.senderId)
  if (counterpart !== undefined) {
    const blocked = await deps.blockRepository.existsBetween(input.senderId, counterpart)
    if (blocked) {
      throw new ForbiddenError('cannot send to a blocked counterpart')
    }
  }

  // createMessage validates body length / non-empty.
  const msg = createMessage({
    id: deps.idGenerator.message(),
    conversationId: input.conversationId,
    senderId: input.senderId,
    body: input.body,
    sentAt: deps.clock.now(),
  })

  await deps.messageRepository.save(msg)
  return msg
}
