import { describe, expect, it } from 'vitest'
import {
  createLike,
  createPost,
  type LikeId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import { createInMemoryPostRepository } from './post-repository'
import { createInMemoryLikeRepository } from './like-repository'

const me = 'u_me' as UserId
const author = 'u_author' as UserId
const other = 'u_other' as UserId

const jst = (y: number, m: number, d: number, h: number, min = 0): Date =>
  new Date(Date.UTC(y, m - 1, d, h - 9, min, 0))

describe('InMemoryLikeRepository', () => {
  it('saves and retrieves by id', async () => {
    const postRepo = createInMemoryPostRepository()
    const repo = createInMemoryLikeRepository(postRepo)
    const l = createLike({
      id: 'l1' as LikeId,
      postId: 'p1' as PostId,
      userId: me,
      addedAt: jst(2026, 5, 26, 2, 10),
    })
    await repo.save(l)
    expect(await repo.findById('l1' as LikeId)).toBe(l)
  })

  it('findByPostAndUser returns existing like or null', async () => {
    const postRepo = createInMemoryPostRepository()
    const repo = createInMemoryLikeRepository(postRepo)
    await repo.save(
      createLike({
        id: 'l1' as LikeId,
        postId: 'p1' as PostId,
        userId: me,
        addedAt: jst(2026, 5, 26, 2, 10),
      }),
    )
    expect((await repo.findByPostAndUser('p1' as PostId, me))?.id).toBe('l1')
    expect(await repo.findByPostAndUser('p2' as PostId, me)).toBeNull()
  })

  it('delete removes the record', async () => {
    const postRepo = createInMemoryPostRepository()
    const repo = createInMemoryLikeRepository(postRepo)
    await repo.save(
      createLike({
        id: 'l1' as LikeId,
        postId: 'p1' as PostId,
        userId: me,
        addedAt: jst(2026, 5, 26, 2, 10),
      }),
    )
    await repo.delete('l1' as LikeId)
    expect(await repo.findById('l1' as LikeId)).toBeNull()
  })

  it('countByPost returns the number of likes on a given post', async () => {
    const postRepo = createInMemoryPostRepository()
    const repo = createInMemoryLikeRepository(postRepo)
    await repo.save(
      createLike({
        id: 'l1' as LikeId,
        postId: 'p1' as PostId,
        userId: me,
        addedAt: jst(2026, 5, 26, 2, 10),
      }),
    )
    await repo.save(
      createLike({
        id: 'l2' as LikeId,
        postId: 'p1' as PostId,
        userId: other,
        addedAt: jst(2026, 5, 26, 2, 11),
      }),
    )
    expect(await repo.countByPost('p1' as PostId)).toBe(2)
    expect(await repo.countByPost('p2' as PostId)).toBe(0)
  })

  it('countReceivedByUser counts likes on posts authored by that user', async () => {
    const postRepo = createInMemoryPostRepository()
    const repo = createInMemoryLikeRepository(postRepo)
    await postRepo.save(
      createPost({
        id: 'p1' as PostId,
        authorId: author,
        body: 'mine',
        postedAt: jst(2026, 5, 26, 2, 0),
      }),
    )
    await postRepo.save(
      createPost({
        id: 'p2' as PostId,
        authorId: other,
        body: 'theirs',
        postedAt: jst(2026, 5, 26, 2, 1),
      }),
    )
    await repo.save(
      createLike({
        id: 'l1' as LikeId,
        postId: 'p1' as PostId,
        userId: me,
        addedAt: jst(2026, 5, 26, 2, 5),
      }),
    )
    await repo.save(
      createLike({
        id: 'l2' as LikeId,
        postId: 'p2' as PostId,
        userId: me,
        addedAt: jst(2026, 5, 26, 2, 6),
      }),
    )

    expect(await repo.countReceivedByUser(author)).toBe(1)
    expect(await repo.countReceivedByUser(other)).toBe(1)
    expect(await repo.countReceivedByUser(me)).toBe(0)
  })
})
