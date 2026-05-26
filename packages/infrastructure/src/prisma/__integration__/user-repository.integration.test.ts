import { describe, expect, it } from 'vitest'
import type { UserId } from '@me-me-en/domain'
import { createUser } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaUserRepository } from '../user-repository'

const alice = (): ReturnType<typeof createUser> =>
  createUser({
    id: 'u_alice' as UserId,
    nickname: 'alice',
    bio: 'hello',
    tone: '#E8E2D2',
    presenceVisibility: 'visible',
    currentSigns: ['sleepless'],
    joinedAt: new Date('2026-05-25T22:00:00Z'),
  })

describe('PrismaUserRepository (integration)', () => {
  it('save + findById round-trips an entity', async () => {
    const repo = createPrismaUserRepository(prisma)
    const u = alice()
    await repo.save(u)
    const found = await repo.findById(u.id)
    expect(found).not.toBeNull()
    expect(found?.id).toBe(u.id)
    expect(found?.nickname).toBe('alice')
    expect(found?.tone).toBe('#E8E2D2')
    expect(found?.currentSigns).toEqual(['sleepless'])
  })

  it('save is upsert — second save updates existing row', async () => {
    const repo = createPrismaUserRepository(prisma)
    const u = alice()
    await repo.save(u)
    const updated = { ...u, nickname: 'alice prime', bio: 'updated' }
    await repo.save(updated)
    const found = await repo.findById(u.id)
    expect(found?.nickname).toBe('alice prime')
    expect(found?.bio).toBe('updated')
  })

  it('list returns ascending by joinedAt', async () => {
    const repo = createPrismaUserRepository(prisma)
    await repo.save({
      ...alice(),
      id: 'u_bob' as UserId,
      nickname: 'bob',
      joinedAt: new Date('2026-05-26T00:00:00Z'),
    })
    await repo.save({
      ...alice(),
      id: 'u_carol' as UserId,
      nickname: 'carol',
      joinedAt: new Date('2026-05-24T00:00:00Z'),
    })
    const all = await repo.list()
    expect(all.map((u) => u.nickname)).toEqual(['carol', 'bob'])
  })
})
