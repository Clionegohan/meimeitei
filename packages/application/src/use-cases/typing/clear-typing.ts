import type { ConversationId, TypingRepository, UserId } from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type ClearTypingDeps = {
  typingRepository: TypingRepository
  businessHoursGuard: BusinessHoursGuard
}

export type ClearTypingInput = {
  conversationId: ConversationId
  userId: UserId
}

export type ClearTyping = (input: ClearTypingInput) => Promise<void>

// Idempotent: TypingRepository.clear is a no-op when no record exists.
export const createClearTyping = (deps: ClearTypingDeps): ClearTyping => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  await deps.typingRepository.clear(input.conversationId, input.userId)
}
