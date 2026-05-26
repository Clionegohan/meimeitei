import { describe, expect, it } from 'vitest'
import { createBlock } from '@me-me-en/domain'
import type { BlockId, UserId } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaBlockRepository } from '../block-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId
const carol = 'u_carol' as UserId

const seed = (id: string, blocker: UserId, blocked: UserId) =>
  createBlock({
    id: id as BlockId,
    blockerId: blocker,
    blockedId: blocked,
    createdAt: new Date('2026-05-25T22:00:00Z'),
  })

describe('PrismaBlockRepository (integration)', () => {
  it('save + findById + findBy (exact direction)', async () => {
    const repo = createPrismaBlockRepository(prisma)
    await repo.save(seed('b1', alice, bob))
    expect((await repo.findById('b1' as BlockId))?.id).toBe('b1')
    expect((await repo.findBy(alice, bob))?.id).toBe('b1')
    expect(await repo.findBy(bob, alice)).toBeNull()
  })

  it('existsBetween is undirected', async () => {
    const repo = createPrismaBlockRepository(prisma)
    await repo.save(seed('b1', alice, bob))
    expect(await repo.existsBetween(alice, bob)).toBe(true)
    expect(await repo.existsBetween(bob, alice)).toBe(true)
    expect(await repo.existsBetween(alice, carol)).toBe(false)
  })

  it('listBlockedBy / listBlockersOf', async () => {
    const repo = createPrismaBlockRepository(prisma)
    await repo.save(seed('b1', alice, bob))
    await repo.save(seed('b2', alice, carol))
    await repo.save(seed('b3', carol, bob))

    expect([...(await repo.listBlockedBy(alice))].sort()).toEqual([bob, carol].sort())
    expect([...(await repo.listBlockersOf(bob))].sort()).toEqual([alice, carol].sort())
    expect(await repo.listBlockersOf(alice)).toEqual([])
  })

  it('delete is idempotent', async () => {
    const repo = createPrismaBlockRepository(prisma)
    await expect(repo.delete('does-not-exist' as BlockId)).resolves.toBeUndefined()
  })
})
