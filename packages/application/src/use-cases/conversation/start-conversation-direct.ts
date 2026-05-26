import {
  createConversation,
  ForbiddenError,
  NotFoundError,
  type BlockRepository,
  type Conversation,
  type ConversationRepository,
  type UserId,
  type UserRepository,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'
import type { IdGenerator } from '../../ports/id-generator'

export type StartConversationDirectDeps = {
  conversationRepository: ConversationRepository
  userRepository: UserRepository
  blockRepository: BlockRepository
  clock: Clock
  idGenerator: IdGenerator
  businessHoursGuard: BusinessHoursGuard
}

export type StartConversationDirectInput = {
  initiatorId: UserId
  partnerId: UserId
}

export type StartConversationDirect = (
  input: StartConversationDirectInput,
) => Promise<Conversation>

export const createStartConversationDirect = (
  deps: StartConversationDirectDeps,
): StartConversationDirect => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  const partner = await deps.userRepository.findById(input.partnerId)
  if (partner === null) {
    throw new NotFoundError(`user ${input.partnerId} not found`)
  }

  const blocked = await deps.blockRepository.existsBetween(input.initiatorId, input.partnerId)
  if (blocked) {
    throw new ForbiddenError('cannot start a conversation with a blocked user')
  }

  // R2 conversation key = (sorted_pair, null). Reuse if it exists.
  const existing = await deps.conversationRepository.findByPair(
    [input.initiatorId, input.partnerId],
    null,
  )
  if (existing !== null) return existing

  // self-DM (initiator == partner) is rejected here by createConversation factory.
  const conv = createConversation({
    id: deps.idGenerator.conversation(),
    participants: [input.initiatorId, input.partnerId],
    rootPostId: null,
    openedAt: deps.clock.now(),
  })
  await deps.conversationRepository.save(conv)
  return conv
}
