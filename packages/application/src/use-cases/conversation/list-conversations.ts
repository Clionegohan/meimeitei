import type {
  BlockRepository,
  Conversation,
  ConversationRepository,
  UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type ListConversationsDeps = {
  conversationRepository: ConversationRepository
  blockRepository: BlockRepository
  businessHoursGuard: BusinessHoursGuard
}

export type ListConversationsInput = {
  userId: UserId
}

export type ListConversations = (
  input: ListConversationsInput,
) => Promise<readonly Conversation[]>

export const createListConversations = (
  deps: ListConversationsDeps,
): ListConversations => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const all = await deps.conversationRepository.listByUser(input.userId)
  const filtered: Conversation[] = []
  for (const conv of all) {
    const counterpart = conv.participantIds.find((id) => id !== input.userId)
    if (counterpart === undefined) continue
    const blocked = await deps.blockRepository.existsBetween(input.userId, counterpart)
    if (!blocked) filtered.push(conv)
  }
  return filtered
}
