import { describe, expect, it } from 'vitest'
import { createPost } from '@me-me-en/domain'
import type { NightId, PostId, UserId } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaPostRepository } from '../post-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

const newPost = (id: string, authorId: UserId, postedAt: Date, body = 'hi') =>
  createPost({
    id: id as PostId,
    authorId,
    body,
    postedAt,
  })

describe('PrismaPostRepository (integration)', () => {
  it('list({ nightId }) filters by nightId and orders desc by postedAt', async () => {
    const repo = createPrismaPostRepository(prisma)
    await repo.save(newPost('p1', alice, new Date('2026-05-25T22:00:00Z')))
    await repo.save(newPost('p2', alice, new Date('2026-05-25T22:30:00Z')))
    await repo.save(newPost('p3', bob, new Date('2026-05-23T22:00:00Z')))

    const tonight = await repo.list({ nightId: '2026-05-25' as NightId })
    expect(tonight.map((p) => p.id)).toEqual(['p2', 'p1'])
  })

  it('list({ authorId }) returns the author posts across nights, desc by postedAt', async () => {
    const repo = createPrismaPostRepository(prisma)
    await repo.save(newPost('p1', alice, new Date('2026-05-23T22:00:00Z')))
    await repo.save(newPost('p2', alice, new Date('2026-05-25T22:00:00Z')))
    await repo.save(newPost('p3', bob, new Date('2026-05-25T22:30:00Z')))

    const ownPosts = await repo.list({ authorId: alice })
    expect(ownPosts.map((p) => p.id)).toEqual(['p2', 'p1'])
  })

  it('save is upsert — second save with deletedAt updates the row', async () => {
    const repo = createPrismaPostRepository(prisma)
    const p = newPost('p1', alice, new Date('2026-05-25T22:00:00Z'))
    await repo.save(p)
    await repo.save({ ...p, deletedAt: new Date('2026-05-25T23:00:00Z') })

    const found = await repo.findById(p.id)
    expect(found?.deletedAt).not.toBeNull()
  })
})
