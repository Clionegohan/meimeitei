import { describe, expect, it } from 'vitest'
import {
  createLike,
  ForbiddenError,
  type LikeId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  inMemoryLikeRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createUnlikePost } from './unlike-post'

const me = 'u_me' as UserId

describe('unlikePost', () => {
  it('removes the existing like', async () => {
    const likeRepo = inMemoryLikeRepo()
    likeRepo.state.push(
      createLike({
        id: 'l1' as LikeId,
        postId: 'p1' as PostId,
        userId: me,
        addedAt: jst(2026, 5, 26, 2, 20),
      }),
    )

    const unlike = createUnlikePost({
      likeRepository: likeRepo.repo,
      businessHoursGuard: openGuard,
    })

    await unlike({ userId: me, postId: 'p1' as PostId })
    expect(likeRepo.state.length).toBe(0)
  })

  it('is a no-op when no like exists (idempotent)', async () => {
    const likeRepo = inMemoryLikeRepo()
    const unlike = createUnlikePost({
      likeRepository: likeRepo.repo,
      businessHoursGuard: openGuard,
    })

    await expect(
      unlike({ userId: me, postId: 'p1' as PostId }),
    ).resolves.toBeUndefined()
    expect(likeRepo.state.length).toBe(0)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const likeRepo = inMemoryLikeRepo()
    const unlike = createUnlikePost({
      likeRepository: likeRepo.repo,
      businessHoursGuard: closedGuard,
    })

    await expect(
      unlike({ userId: me, postId: 'p1' as PostId }),
    ).rejects.toThrow(ForbiddenError)
  })
})
