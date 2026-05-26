import { describe, expect, it } from 'vitest'
import { createPresence, type UserId } from '@me-me-en/domain'
import { createInMemoryPresenceRepository } from './presence-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

describe('InMemoryPresenceRepository', () => {
  it('sets and retrieves presence per user', async () => {
    const repo = createInMemoryPresenceRepository()
    const p = createPresence({
      userId: alice,
      status: 'online',
      lastSeenAt: new Date('2026-05-26T02:00:00Z'),
    })
    await repo.set(p)
    expect(await repo.findByUser(alice)).toBe(p)
  })

  it('returns null for unknown user', async () => {
    const repo = createInMemoryPresenceRepository()
    expect(await repo.findByUser(bob)).toBeNull()
  })

  it('set overwrites existing presence for the same user', async () => {
    const repo = createInMemoryPresenceRepository()
    await repo.set(
      createPresence({ userId: alice, status: 'online', lastSeenAt: new Date() }),
    )
    const offline = createPresence({
      userId: alice,
      status: 'offline',
      lastSeenAt: new Date(),
    })
    await repo.set(offline)
    expect(await repo.findByUser(alice)).toBe(offline)
  })

  it('listOnline returns only online presences', async () => {
    const repo = createInMemoryPresenceRepository()
    await repo.set(
      createPresence({ userId: alice, status: 'online', lastSeenAt: new Date() }),
    )
    await repo.set(
      createPresence({ userId: bob, status: 'offline', lastSeenAt: new Date() }),
    )
    const result = await repo.listOnline()
    expect(result.map((p) => p.userId)).toEqual([alice])
  })
})
