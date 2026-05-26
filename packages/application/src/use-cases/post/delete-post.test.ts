import { describe, expect, it } from 'vitest'
import {
  createPost,
  ForbiddenError,
  NotFoundError,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryPostRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createDeletePost } from './delete-post'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

const seedPost = (id: string, author: UserId) =>
  createPost({
    id: id as PostId,
    authorId: author,
    body: 'a post',
    postedAt: jst(2026, 5, 26, 2, 0),
  })

describe('deletePost', () => {
  it('soft-deletes a post by its author', async () => {
    const postRepo = inMemoryPostRepo()
    postRepo.state.push(seedPost('p1', alice))

    const del = createDeletePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })

    const updated = await del({ actorId: alice, postId: 'p1' as PostId })
    expect(updated.deletedAt?.toISOString()).toBe('2026-05-25T18:00:00.000Z')
    expect(postRepo.state[0]?.deletedAt).not.toBeNull()
  })

  it('is idempotent (already-deleted returns the same instance)', async () => {
    const postRepo = inMemoryPostRepo()
    postRepo.state.push(seedPost('p1', alice))

    const del = createDeletePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })

    const first = await del({ actorId: alice, postId: 'p1' as PostId })
    const second = await del({ actorId: alice, postId: 'p1' as PostId })
    expect(second.deletedAt?.toISOString()).toBe(first.deletedAt?.toISOString())
  })

  it('throws NotFoundError when post does not exist', async () => {
    const postRepo = inMemoryPostRepo()
    const del = createDeletePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })

    await expect(
      del({ actorId: alice, postId: 'ghost' as PostId }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when actor is not the author', async () => {
    const postRepo = inMemoryPostRepo()
    postRepo.state.push(seedPost('p1', alice))

    const del = createDeletePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })

    await expect(
      del({ actorId: bob, postId: 'p1' as PostId }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const postRepo = inMemoryPostRepo()
    postRepo.state.push(seedPost('p1', alice))

    const del = createDeletePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      businessHoursGuard: closedGuard,
    })

    await expect(
      del({ actorId: alice, postId: 'p1' as PostId }),
    ).rejects.toThrow(ForbiddenError)
  })
})
