import { describe, expect, it } from 'vitest'
import {
  createPost,
  ForbiddenError,
  markPostAsDeleted,
  NotFoundError,
  type BlockId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryBlockRepo,
  inMemoryLikeRepo,
  inMemoryPostRepo,
  jst,
  openGuard,
  sequentialIdGen,
} from '../../__test-helpers__/fakes'
import { createLikePost } from './like-post'

const me = 'u_me' as UserId
const author = 'u_author' as UserId

const seedPost = (id: string, authorId: UserId) =>
  createPost({
    id: id as PostId,
    authorId,
    body: 'a post',
    postedAt: jst(2026, 5, 26, 2, 0),
  })

describe('likePost', () => {
  it('creates a like and persists it', async () => {
    const postRepo = inMemoryPostRepo()
    const likeRepo = inMemoryLikeRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', author))

    const like = createLikePost({
      postRepository: postRepo.repo,
      likeRepository: likeRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const result = await like({ userId: me, postId: 'p1' as PostId })
    expect(result.postId).toBe('p1')
    expect(result.userId).toBe(me)
    expect(likeRepo.state.length).toBe(1)
  })

  it('is idempotent — returns the existing like without creating a new one', async () => {
    const postRepo = inMemoryPostRepo()
    const likeRepo = inMemoryLikeRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', author))

    const like = createLikePost({
      postRepository: postRepo.repo,
      likeRepository: likeRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const first = await like({ userId: me, postId: 'p1' as PostId })
    const second = await like({ userId: me, postId: 'p1' as PostId })
    expect(second.id).toBe(first.id)
    expect(likeRepo.state.length).toBe(1)
  })

  it('throws NotFoundError when post does not exist', async () => {
    const postRepo = inMemoryPostRepo()
    const likeRepo = inMemoryLikeRepo()
    const blockRepo = inMemoryBlockRepo()

    const like = createLikePost({
      postRepository: postRepo.repo,
      likeRepository: likeRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      like({ userId: me, postId: 'ghost' as PostId }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when the post is deleted', async () => {
    const postRepo = inMemoryPostRepo()
    const likeRepo = inMemoryLikeRepo()
    const blockRepo = inMemoryBlockRepo()
    const p = seedPost('p1', author)
    postRepo.state.push(markPostAsDeleted(p, jst(2026, 5, 26, 2, 10)))

    const like = createLikePost({
      postRepository: postRepo.repo,
      likeRepository: likeRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      like({ userId: me, postId: 'p1' as PostId }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError when blocked relationship with author exists', async () => {
    const postRepo = inMemoryPostRepo()
    const likeRepo = inMemoryLikeRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', author))
    blockRepo.state.push({
      id: 'b1' as BlockId,
      blockerId: author,
      blockedId: me,
      createdAt: jst(2026, 5, 26, 1, 0),
    })

    const like = createLikePost({
      postRepository: postRepo.repo,
      likeRepository: likeRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      like({ userId: me, postId: 'p1' as PostId }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const postRepo = inMemoryPostRepo()
    const likeRepo = inMemoryLikeRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', author))

    const like = createLikePost({
      postRepository: postRepo.repo,
      likeRepository: likeRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: closedGuard,
    })

    await expect(
      like({ userId: me, postId: 'p1' as PostId }),
    ).rejects.toThrow(ForbiddenError)
  })
})
