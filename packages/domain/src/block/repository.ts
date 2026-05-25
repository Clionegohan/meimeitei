import type { BlockId, UserId } from '../shared/id'
import type { Block } from './block'

// BlockRepository は domain layer の port。
// `(blockerId, blockedId)` の unique 制約は implementer の契約。
// `existsBetween(a, b)` は無向（どちらが blocker でも true を返す）。
export interface BlockRepository {
  findById(id: BlockId): Promise<Block | null>
  findBy(blockerId: UserId, blockedId: UserId): Promise<Block | null>
  save(block: Block): Promise<void>
  delete(id: BlockId): Promise<void>
  // Either direction counts.
  existsBetween(a: UserId, b: UserId): Promise<boolean>
  listBlockedBy(blockerId: UserId): Promise<readonly UserId[]>
}
