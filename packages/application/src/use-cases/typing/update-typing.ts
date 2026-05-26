import {
  createTyping,
  ForbiddenError,
  NotFoundError,
  type BlockRepository,
  type ConversationId,
  type ConversationRepository,
  type Typing,
  type TypingRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'

export type UpdateTypingDeps = {
  conversationRepository: ConversationRepository
  typingRepository: TypingRepository
  blockRepository: BlockRepository
  clock: Clock
  businessHoursGuard: BusinessHoursGuard
}

export type UpdateTypingInput = {
  conversationId: ConversationId
  userId: UserId
}

export type UpdateTyping = (input: UpdateTypingInput) => Promise<Typing>

export const createUpdateTyping = (deps: UpdateTypingDeps): UpdateTyping => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  const conv = await deps.conversationRepository.findById(input.conversationId)
  if (conv === null) {
    throw new NotFoundError(`conversation ${input.conversationId} not found`)
  }
  if (!conv.participantIds.includes(input.userId)) {
    throw new ForbiddenError('user is not a participant of this conversation')
  }

  const counterpart = conv.participantIds.find((id) => id !== input.userId)
  if (counterpart !== undefined) {
    const blocked = await deps.blockRepository.existsBetween(input.userId, counterpart)
    if (blocked) {
      throw new ForbiddenError('cannot signal typing in a blocked relationship')
    }
  }

  const typing = createTyping({
    conversationId: input.conversationId,
    userId: input.userId,
    startedAt: deps.clock.now(),
  })
  await deps.typingRepository.set(typing)
  return typing
}
