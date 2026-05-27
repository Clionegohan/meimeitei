import {
  type BlockRepository,
  type User,
  type UserId,
  type UserRepository,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type ListUsersDeps = {
  userRepository: UserRepository
  blockRepository: BlockRepository
  businessHoursGuard: BusinessHoursGuard
}

export type ListUsersInput = {
  viewerId: UserId
}

export type ListUsers = (input: ListUsersInput) => Promise<readonly User[]>

// 客帳 (spec S-c): 全ユーザー一覧。block 関係 (無向) にある相手は除外し、
// viewer 自身は常に含める (自席への動線)。並びは UserRepository.list の契約
// (joinedAt 昇順) に従う。
export const createListUsers = (deps: ListUsersDeps): ListUsers => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const all = await deps.userRepository.list()

  const result: User[] = []
  for (const user of all) {
    if (user.id !== input.viewerId) {
      const blocked = await deps.blockRepository.existsBetween(input.viewerId, user.id)
      if (blocked) continue
    }
    result.push(user)
  }
  return result
}
