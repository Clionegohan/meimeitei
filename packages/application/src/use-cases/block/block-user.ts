import {
  createBlock,
  type Block,
  type BlockRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'
import type { IdGenerator } from '../../ports/id-generator'

export type BlockUserDeps = {
  blockRepository: BlockRepository
  clock: Clock
  idGenerator: IdGenerator
  businessHoursGuard: BusinessHoursGuard
}

export type BlockUserInput = {
  blockerId: UserId
  blockedId: UserId
}

export type BlockUser = (input: BlockUserInput) => Promise<Block>

export const createBlockUser = (deps: BlockUserDeps): BlockUser => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  // Idempotent: returning the existing record if (blocker, blocked) already exists.
  const existing = await deps.blockRepository.findBy(input.blockerId, input.blockedId)
  if (existing !== null) return existing

  // createBlock factory throws ValidationError on self-block.
  const block = createBlock({
    id: deps.idGenerator.block(),
    blockerId: input.blockerId,
    blockedId: input.blockedId,
    createdAt: deps.clock.now(),
  })
  await deps.blockRepository.save(block)
  return block
}
