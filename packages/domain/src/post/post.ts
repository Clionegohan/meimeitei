import { ValidationError } from '../shared/errors'
import type { PostId, UserId } from '../shared/id'
import { nightIdOf, type NightId } from '../shared/time'

export type Post = {
  readonly id: PostId
  readonly authorId: UserId
  readonly body: string
  readonly postedAt: Date
  readonly nightId: NightId
  readonly deletedAt: Date | null
}

export type CreatePostInput = {
  id: PostId
  authorId: UserId
  body: string
  postedAt: Date
}

const BODY_MAX = 280
const graphemeLength = (s: string): number => [...s].length

// nightId is derived from postedAt via nightIdOf, which throws
// ValidationError if postedAt is outside business hours (22:00-05:00 JST).
// Therefore a Post can only exist with a postedAt inside the night.
export const createPost = (input: CreatePostInput): Post => {
  if (input.body.trim().length === 0) {
    throw new ValidationError('post body must not be empty')
  }
  if (graphemeLength(input.body) > BODY_MAX) {
    throw new ValidationError(`post body must be at most ${BODY_MAX} characters`)
  }
  const nightId = nightIdOf(input.postedAt)
  return {
    id: input.id,
    authorId: input.authorId,
    body: input.body,
    postedAt: input.postedAt,
    nightId,
    deletedAt: null,
  }
}

// Idempotent soft delete. body is preserved at this layer; the
// presentation / use case layer decides what to show to other users
// (orphan R1 conversations may render the placeholder).
export const markPostAsDeleted = (post: Post, deletedAt: Date): Post => {
  if (post.deletedAt !== null) return post
  return { ...post, deletedAt }
}
