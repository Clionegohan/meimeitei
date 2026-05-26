import {
  createPost as createPostEntity,
  type Post,
  type PostRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'
import type { IdGenerator } from '../../ports/id-generator'

export type CreatePostDeps = {
  postRepository: PostRepository
  clock: Clock
  idGenerator: IdGenerator
  businessHoursGuard: BusinessHoursGuard
}

export type CreatePostInput = {
  authorId: UserId
  body: string
}

export type CreatePost = (input: CreatePostInput) => Promise<Post>

export const createCreatePost = (deps: CreatePostDeps): CreatePost => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  // createPostEntity will throw ValidationError if body is invalid OR if
  // postedAt is somehow outside business hours (double protection on top
  // of the guard).
  const post = createPostEntity({
    id: deps.idGenerator.post(),
    authorId: input.authorId,
    body: input.body,
    postedAt: deps.clock.now(),
  })

  await deps.postRepository.save(post)
  return post
}
