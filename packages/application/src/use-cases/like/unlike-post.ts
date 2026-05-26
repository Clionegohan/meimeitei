import type { LikeRepository, PostId, UserId } from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'

export type UnlikePostDeps = {
  likeRepository: LikeRepository
  businessHoursGuard: BusinessHoursGuard
}

export type UnlikePostInput = {
  userId: UserId
  postId: PostId
}

export type UnlikePost = (input: UnlikePostInput) => Promise<void>

// Idempotent: no-op if no like exists for (post, user).
export const createUnlikePost = (deps: UnlikePostDeps): UnlikePost => async (input) => {
  deps.businessHoursGuard.ensureOpen()
  const existing = await deps.likeRepository.findByPostAndUser(input.postId, input.userId)
  if (existing !== null) {
    await deps.likeRepository.delete(existing.id)
  }
}
