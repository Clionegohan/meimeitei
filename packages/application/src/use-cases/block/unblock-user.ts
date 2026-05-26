import type { BlockRepository, UserId } from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type UnblockUserDeps = {
  blockRepository: BlockRepository
  businessHoursGuard: BusinessHoursGuard
}

export type UnblockUserInput = {
  blockerId: UserId
  blockedId: UserId
}

export type UnblockUser = (input: UnblockUserInput) => Promise<void>

// Idempotent: no-op if (blocker, blocked) has no existing record.
export const createUnblockUser = (deps: UnblockUserDeps): UnblockUser => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const existing = await deps.blockRepository.findBy(input.blockerId, input.blockedId)
  if (existing !== null) {
    await deps.blockRepository.delete(existing.id)
  }
}
