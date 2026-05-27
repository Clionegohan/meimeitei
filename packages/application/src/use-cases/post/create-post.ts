import {
  RateLimitError,
  createPost as createPostEntity,
  type Post,
  type PostRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'
import type { IdGenerator } from '../../ports/id-generator'

// spec C: 30 秒に 1 投稿。連投クールダウン。
const RATE_LIMIT_MS = 30_000

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

  const now = deps.clock.now()

  // rate limit: 直近の自分の投稿から 30 秒未満なら拒否。削除済みも postedAt を
  // 残すため list に含まれ、「削除して連投」での回避を防ぐ。
  const [latest] = await deps.postRepository.list({
    authorId: input.authorId,
    limit: 1,
  })
  if (latest !== undefined) {
    const elapsed = now.getTime() - latest.postedAt.getTime()
    if (elapsed < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000)
      throw new RateLimitError(
        `投稿の間隔が短すぎます。あと ${waitSec} 秒お待ちください。`,
      )
    }
  }

  // createPostEntity will throw ValidationError if body is invalid OR if
  // postedAt is somehow outside business hours (double protection on top
  // of the guard).
  const post = createPostEntity({
    id: deps.idGenerator.post(),
    authorId: input.authorId,
    body: input.body,
    postedAt: now,
  })

  await deps.postRepository.save(post)
  return post
}
