import {
  NotFoundError,
  type AuthIdentityRepository,
  type UserId,
  type UserRepository,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type DeleteAccountDeps = {
  userRepository: UserRepository
  authIdentityRepository: AuthIdentityRepository
  businessHoursGuard: BusinessHoursGuard
}

export type DeleteAccountInput = {
  userId: UserId
}

export type DeleteAccount = (input: DeleteAccountInput) => Promise<void>

// 退苑 (アカウント削除)。auth identity を消して sign-in を断ち、user レコードを消す。
// 投稿・手紙など本人の足跡は infrastructure (Prisma) の cascade に委ねる。
// in-memory では孤立し得るが、表示側は author 不在を「名なし」で degrade する。
export const createDeleteAccount =
  (deps: DeleteAccountDeps): DeleteAccount =>
  async (input) => {
    deps.businessHoursGuard.ensureOpen()
    const user = await deps.userRepository.findById(input.userId)
    if (user === null) {
      throw new NotFoundError('退苑対象の羊が見つかりません')
    }
    await deps.authIdentityRepository.deleteByUser(input.userId)
    await deps.userRepository.delete(input.userId)
  }
