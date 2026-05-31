import type { BlockRepository, User, UserId, UserRepository } from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type ListBlockedUsersDeps = {
  blockRepository: BlockRepository
  userRepository: UserRepository
  businessHoursGuard: BusinessHoursGuard
}

export type ListBlockedUsersInput = {
  viewerId: UserId
}

export type ListBlockedUsers = (input: ListBlockedUsersInput) => Promise<readonly User[]>

// viewer が遮断している羊の一覧 (解除 UI 用)。逆向き (自分を遮断している相手) は
// 秘匿の都合で返さない。user レコードが消えている id は黙って除外する。
export const createListBlockedUsers =
  (deps: ListBlockedUsersDeps): ListBlockedUsers =>
  async (input) => {
    deps.businessHoursGuard.ensureOpen()
    const ids = await deps.blockRepository.listBlockedBy(input.viewerId)
    const users: User[] = []
    for (const id of ids) {
      const u = await deps.userRepository.findById(id)
      if (u !== null) users.push(u)
    }
    return users
  }
