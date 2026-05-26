import { describe, expect, it } from 'vitest'
import {
  createPost,
  type NightId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import { createInMemoryPostRepository } from './post-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

const jst = (y: number, m: number, d: number, h: number, min = 0): Date =>
  new Date(Date.UTC(y, m - 1, d, h - 9, min, 0))

const seedPost = (id: string, author: UserId, postedAt: Date) =>
  createPost({
    id: id as PostId,
    authorId: author,
    body: `body-${id}`,
    postedAt,
  })

describe('InMemoryPostRepository', () => {
  it('saves and retrieves by id', async () => {
    const repo = createInMemoryPostRepository()
    const p = seedPost('p1', alice, jst(2026, 5, 26, 2, 0))
    await repo.save(p)
    expect(await repo.findById('p1' as PostId)).toBe(p)
  })

  it('list filters by nightId and orders desc by postedAt', async () => {
    const repo = createInMemoryPostRepository()
    await repo.save(seedPost('p1', alice, jst(2026, 5, 26, 2, 10)))
    await repo.save(seedPost('p2', alice, jst(2026, 5, 26, 2, 30)))
    await repo.save(seedPost('p3', alice, jst(2026, 5, 25, 23, 0))) // same night actually
    const result = await repo.list({ nightId: '2026-05-25' as NightId })
    expect(result.map((p) => p.id)).toEqual(['p2', 'p1', 'p3'])
  })

  it('list filters by authorId', async () => {
    const repo = createInMemoryPostRepository()
    await repo.save(seedPost('p1', alice, jst(2026, 5, 26, 2, 0)))
    await repo.save(seedPost('p2', bob, jst(2026, 5, 26, 2, 5)))
    const result = await repo.list({ authorId: alice })
    expect(result.map((p) => p.id)).toEqual(['p1'])
  })

  it('before/limit applies cursor pagination', async () => {
    const repo = createInMemoryPostRepository()
    for (let i = 1; i <= 5; i++) {
      await repo.save(seedPost(`p${i}`, alice, jst(2026, 5, 26, 2, i)))
    }
    const result = await repo.list({
      authorId: alice,
      before: jst(2026, 5, 26, 2, 4),
      limit: 2,
    })
    // before excludes p4 / p5; desc order -> p3 then p2
    expect(result.map((p) => p.id)).toEqual(['p3', 'p2'])
  })
})
