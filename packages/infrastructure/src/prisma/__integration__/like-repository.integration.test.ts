import { describe, expect, it } from 'vitest'
import { createLike, createPost } from '@me-me-en/domain'
import type { LikeId, PostId, UserId } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaLikeRepository } from '../like-repository'
import { createPrismaPostRepository } from '../post-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId
const carol = 'u_carol' as UserId

describe('PrismaLikeRepository (integration)', () => {
  it('save + findById + findByPostAndUser', async () => {
    const postRepo = createPrismaPostRepository(prisma)
    const repo = createPrismaLikeRepository(prisma, postRepo)
    const post = createPost({
      id: 'p1' as PostId,
      authorId: alice,
      body: 'hi',
      postedAt: new Date('2026-05-25T22:00:00Z'),
    })
    await postRepo.save(post)

    const like = createLike({
      id: 'l1' as LikeId,
      postId: post.id,
      userId: bob,
      addedAt: new Date('2026-05-25T22:01:00Z'),
    })
    await repo.save(like)

    expect((await repo.findById(like.id))?.id).toBe('l1')
    expect((await repo.findByPostAndUser(post.id, bob))?.id).toBe('l1')
    expect(await repo.findByPostAndUser(post.id, carol)).toBeNull()
  })

  it('countByPost counts all likes for a given post', async () => {
    const postRepo = createPrismaPostRepository(prisma)
    const repo = createPrismaLikeRepository(prisma, postRepo)
    const post = createPost({
      id: 'p1' as PostId,
      authorId: alice,
      body: 'hi',
      postedAt: new Date('2026-05-25T22:00:00Z'),
    })
    await postRepo.save(post)

    await repo.save(createLike({ id: 'l1' as LikeId, postId: post.id, userId: bob, addedAt: new Date() }))
    await repo.save(createLike({ id: 'l2' as LikeId, postId: post.id, userId: carol, addedAt: new Date() }))

    expect(await repo.countByPost(post.id)).toBe(2)
  })

  it('countReceivedByUser sums likes across the author non-deleted posts', async () => {
    const postRepo = createPrismaPostRepository(prisma)
    const repo = createPrismaLikeRepository(prisma, postRepo)
    const p1 = createPost({
      id: 'p1' as PostId,
      authorId: alice,
      body: 'hi',
      postedAt: new Date('2026-05-25T22:00:00Z'),
    })
    const p2 = createPost({
      id: 'p2' as PostId,
      authorId: alice,
      body: 'hi',
      postedAt: new Date('2026-05-25T22:05:00Z'),
    })
    const p3Deleted = {
      ...createPost({
        id: 'p3' as PostId,
        authorId: alice,
        body: 'hi',
        postedAt: new Date('2026-05-25T22:10:00Z'),
      }),
      deletedAt: new Date('2026-05-25T22:11:00Z'),
    }
    await postRepo.save(p1)
    await postRepo.save(p2)
    await postRepo.save(p3Deleted)

    await repo.save(createLike({ id: 'l1' as LikeId, postId: p1.id, userId: bob, addedAt: new Date() }))
    await repo.save(createLike({ id: 'l2' as LikeId, postId: p2.id, userId: bob, addedAt: new Date() }))
    // p3 は削除済なので集計対象外
    await repo.save(createLike({ id: 'l3' as LikeId, postId: p3Deleted.id, userId: carol, addedAt: new Date() }))

    expect(await repo.countReceivedByUser(alice)).toBe(2)
  })

  it('delete is idempotent (no throw on non-existent id)', async () => {
    const postRepo = createPrismaPostRepository(prisma)
    const repo = createPrismaLikeRepository(prisma, postRepo)
    await expect(repo.delete('does-not-exist' as LikeId)).resolves.toBeUndefined()
  })
})
