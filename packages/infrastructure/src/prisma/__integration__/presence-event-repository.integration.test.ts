import { describe, expect, it } from 'vitest'
import { createPresenceEvent } from '@me-me-en/domain'
import type { UserId } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaPresenceEventRepository } from '../presence-event-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

describe('PrismaPresenceEventRepository (integration)', () => {
  it('record + listByUserInWindow returns events in ascending order', async () => {
    const repo = createPrismaPresenceEventRepository(prisma)
    await repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'online',
        occurredAt: new Date('2026-05-25T22:30:00Z'),
      }),
    )
    await repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'offline',
        occurredAt: new Date('2026-05-25T23:00:00Z'),
      }),
    )

    const events = await repo.listByUserInWindow(
      alice,
      new Date('2026-05-25T22:00:00Z'),
      new Date('2026-05-26T00:00:00Z'),
    )
    expect(events.map((e) => e.type)).toEqual(['online', 'offline'])
  })

  it('filters by userId and window [from, to)', async () => {
    const repo = createPrismaPresenceEventRepository(prisma)
    await repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'online',
        occurredAt: new Date('2026-05-25T22:00:00Z'),
      }),
    )
    await repo.record(
      createPresenceEvent({
        userId: bob,
        type: 'online',
        occurredAt: new Date('2026-05-25T22:00:00Z'),
      }),
    )
    await repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'online',
        occurredAt: new Date('2026-05-23T22:00:00Z'),
      }),
    )

    const aliceWindow = await repo.listByUserInWindow(
      alice,
      new Date('2026-05-25T00:00:00Z'),
      new Date('2026-05-26T00:00:00Z'),
    )
    expect(aliceWindow.length).toBe(1)
    expect(aliceWindow[0]?.userId).toBe(alice)
  })

  it('to is exclusive: an event at exactly `to` is not included', async () => {
    const repo = createPrismaPresenceEventRepository(prisma)
    const boundary = new Date('2026-05-26T00:00:00Z')
    await repo.record(
      createPresenceEvent({
        userId: alice,
        type: 'online',
        occurredAt: boundary,
      }),
    )
    const events = await repo.listByUserInWindow(
      alice,
      new Date('2026-05-25T00:00:00Z'),
      boundary,
    )
    expect(events.length).toBe(0)
  })
})
