import { ValidationError } from '../shared/errors'
import type { BlockId, UserId } from '../shared/id'

// Block は一方向（blocker → blocked）。
// 「A と B のいずれか方向にブロックがあれば相互的に影響する」というポリシーは
// 本 entity ではなく use case 側で `BlockRepository.existsBetween` を使って判定する。
export type Block = {
  readonly id: BlockId
  readonly blockerId: UserId
  readonly blockedId: UserId
  readonly createdAt: Date
}

export type CreateBlockInput = {
  id: BlockId
  blockerId: UserId
  blockedId: UserId
  createdAt: Date
}

export const createBlock = (input: CreateBlockInput): Block => {
  if (input.blockerId === input.blockedId) {
    throw new ValidationError('cannot block yourself')
  }
  return {
    id: input.id,
    blockerId: input.blockerId,
    blockedId: input.blockedId,
    createdAt: input.createdAt,
  }
}
