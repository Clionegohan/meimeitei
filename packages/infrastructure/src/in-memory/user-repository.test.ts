import { describe, expect, it } from 'vitest'
import { createUser, type UserId } from '@me-me-en/domain'
import { createInMemoryUserRepository } from './user-repository'

const seedUser = (id: string, nickname: string) =>
  createUser({
    id: id as UserId,
    nickname,
    joinedAt: new Date('2026-05-26T02:00:00Z'),
  })

describe('InMemoryUserRepository', () => {
  it('saves and retrieves by id', async () => {
    const repo = createInMemoryUserRepository()
    const u = seedUser('u1', 'alice')
    await repo.save(u)
    expect(await repo.findById('u1' as UserId)).toBe(u)
  })

  it('returns null for unknown id', async () => {
    const repo = createInMemoryUserRepository()
    expect(await repo.findById('ghost' as UserId)).toBeNull()
  })

  it('findByNickname returns the matching user or null', async () => {
    const repo = createInMemoryUserRepository()
    await repo.save(seedUser('u1', 'alice'))
    expect((await repo.findByNickname('alice'))?.id).toBe('u1')
    expect(await repo.findByNickname('bob')).toBeNull()
  })

  it('save overwrites by id', async () => {
    const repo = createInMemoryUserRepository()
    await repo.save(seedUser('u1', 'alice'))
    await repo.save(seedUser('u1', 'alice2'))
    expect((await repo.findById('u1' as UserId))?.nickname).toBe('alice2')
  })

  it('list returns all saved users', async () => {
    const repo = createInMemoryUserRepository()
    await repo.save(seedUser('u1', 'alice'))
    await repo.save(seedUser('u2', 'bob'))
    const all = await repo.list()
    expect(all.map((u) => u.id).sort()).toEqual(['u1', 'u2'])
  })
})
