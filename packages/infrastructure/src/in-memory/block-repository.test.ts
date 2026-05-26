import { describe, expect, it } from 'vitest'
import { createBlock, type BlockId, type UserId } from '@me-me-en/domain'
import { createInMemoryBlockRepository } from './block-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId
const carol = 'u_carol' as UserId

const seed = (id: string, blocker: UserId, blocked: UserId) =>
  createBlock({
    id: id as BlockId,
    blockerId: blocker,
    blockedId: blocked,
    createdAt: new Date('2026-05-26T02:00:00Z'),
  })

describe('InMemoryBlockRepository', () => {
  it('saves and retrieves by id', async () => {
    const repo = createInMemoryBlockRepository()
    const b = seed('b1', alice, bob)
    await repo.save(b)
    expect(await repo.findById('b1' as BlockId)).toBe(b)
  })

  it('findBy matches (blocker, blocked) exact direction', async () => {
    const repo = createInMemoryBlockRepository()
    await repo.save(seed('b1', alice, bob))
    expect((await repo.findBy(alice, bob))?.id).toBe('b1')
    expect(await repo.findBy(bob, alice)).toBeNull()
  })

  it('existsBetween is undirected', async () => {
    const repo = createInMemoryBlockRepository()
    await repo.save(seed('b1', alice, bob))
    expect(await repo.existsBetween(alice, bob)).toBe(true)
    expect(await repo.existsBetween(bob, alice)).toBe(true)
    expect(await repo.existsBetween(alice, carol)).toBe(false)
  })

  it('delete removes the record', async () => {
    const repo = createInMemoryBlockRepository()
    await repo.save(seed('b1', alice, bob))
    await repo.delete('b1' as BlockId)
    expect(await repo.findById('b1' as BlockId)).toBeNull()
  })

  it('listBlockedBy returns user ids the blocker has blocked', async () => {
    const repo = createInMemoryBlockRepository()
    await repo.save(seed('b1', alice, bob))
    await repo.save(seed('b2', alice, carol))
    const result = await repo.listBlockedBy(alice)
    expect([...result].sort()).toEqual([bob, carol].sort())
  })

  it('listBlockersOf returns user ids who have blocked the target', async () => {
    const repo = createInMemoryBlockRepository()
    await repo.save(seed('b1', alice, bob))
    await repo.save(seed('b2', carol, bob))
    const result = await repo.listBlockersOf(bob)
    expect([...result].sort()).toEqual([alice, carol].sort())
    expect(await repo.listBlockersOf(alice)).toEqual([])
  })
})
