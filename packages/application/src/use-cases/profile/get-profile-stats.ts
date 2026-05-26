import type {
  LikeRepository,
  LoginHistoryRepository,
  NightId,
  PostRepository,
  UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type ProfileStats = {
  totalLoginNights: number
  consecutiveLoginNights: number
  postCount: number
  candleReceivedCount: number
}

export type GetProfileStatsDeps = {
  loginHistoryRepository: LoginHistoryRepository
  postRepository: PostRepository
  likeRepository: LikeRepository
  businessHoursGuard: BusinessHoursGuard
}

export type GetProfileStatsInput = { userId: UserId }

export type GetProfileStats = (input: GetProfileStatsInput) => Promise<ProfileStats>

// Count consecutive nights from the most recent backwards.
// `nights` is desc (newest first). Two NightIds are "consecutive" if their
// dates differ by exactly 1 day.
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const countConsecutive = (nights: readonly NightId[]): number => {
  if (nights.length === 0) return 0
  let count = 1
  for (let i = 1; i < nights.length; i++) {
    const prev = nights[i - 1]
    const curr = nights[i]
    if (prev === undefined || curr === undefined) break
    const prevMs = Date.parse(`${prev}T00:00:00Z`)
    const currMs = Date.parse(`${curr}T00:00:00Z`)
    if (prevMs - currMs === ONE_DAY_MS) count++
    else break
  }
  return count
}

export const createGetProfileStats = (
  deps: GetProfileStatsDeps,
): GetProfileStats => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const [nights, posts, candles] = await Promise.all([
    deps.loginHistoryRepository.listNightsByUser(input.userId),
    deps.postRepository.list({ authorId: input.userId }),
    deps.likeRepository.countReceivedByUser(input.userId),
  ])
  const postCount = posts.filter((p) => p.deletedAt === null).length
  return {
    totalLoginNights: nights.length,
    consecutiveLoginNights: countConsecutive(nights),
    postCount,
    candleReceivedCount: candles,
  }
}
