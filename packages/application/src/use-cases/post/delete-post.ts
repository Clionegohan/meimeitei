import {
  ForbiddenError,
  markPostAsDeleted,
  NotFoundError,
  type Post,
  type PostId,
  type PostRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'

export type DeletePostDeps = {
  postRepository: PostRepository
  clock: Clock
  businessHoursGuard: BusinessHoursGuard
}

export type DeletePostInput = {
  actorId: UserId
  postId: PostId
}

export type DeletePost = (input: DeletePostInput) => Promise<Post>

export const createDeletePost = (deps: DeletePostDeps): DeletePost => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  const post = await deps.postRepository.findById(input.postId)
  if (post === null) {
    throw new NotFoundError(`post ${input.postId} not found`)
  }
  if (post.authorId !== input.actorId) {
    throw new ForbiddenError('only the author can delete this post')
  }

  // Idempotent: returns the same instance if already deleted.
  const updated = markPostAsDeleted(post, deps.clock.now())
  if (updated !== post) {
    await deps.postRepository.save(updated)
  }
  return updated
}
