import {
  createLike,
  ForbiddenError,
  NotFoundError,
  type BlockRepository,
  type Like,
  type LikeRepository,
  type PostId,
  type PostRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'
import type { IdGenerator } from '../../ports/id-generator'

export type LikePostDeps = {
  postRepository: PostRepository
  likeRepository: LikeRepository
  blockRepository: BlockRepository
  clock: Clock
  idGenerator: IdGenerator
  businessHoursGuard: BusinessHoursGuard
}

export type LikePostInput = {
  userId: UserId
  postId: PostId
}

export type LikePost = (input: LikePostInput) => Promise<Like>

export const createLikePost = (deps: LikePostDeps): LikePost => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  const post = await deps.postRepository.findById(input.postId)
  if (post === null) {
    throw new NotFoundError(`post ${input.postId} not found`)
  }
  if (post.deletedAt !== null) {
    throw new ForbiddenError('cannot like a deleted post')
  }

  const blocked = await deps.blockRepository.existsBetween(input.userId, post.authorId)
  if (blocked) {
    throw new ForbiddenError('cannot like a post by a blocked counterpart')
  }

  // Idempotent: return existing like for (post, user) without creating a new one.
  const existing = await deps.likeRepository.findByPostAndUser(input.postId, input.userId)
  if (existing !== null) return existing

  const like = createLike({
    id: deps.idGenerator.like(),
    postId: input.postId,
    userId: input.userId,
    addedAt: deps.clock.now(),
  })
  await deps.likeRepository.save(like)
  return like
}
