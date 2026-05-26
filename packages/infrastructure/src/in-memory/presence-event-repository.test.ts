import { describe, expect, it } from 'vitest'
import { createPresenceEvent, type UserId } from '@me-me-en/domain'
import { createInMemoryPresenceEventRepository } from './presence-event-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

const at = (h: number, m = 0): Date =>
  new Date(Date.UTC(2026, 4, 26, h - 9, m, 0))

describe('InMemoryPresenceEventRepository', () => {
  it('records events and returns them ascending by occurredAt', async () => {
    const repo = createInMemoryPresenceEventRepository()
    await repo.record(
      createPresenceEvent({ userId: alice, type: 'online', occurredAt: at(22) }),
    )
    await repo.record(
      createPresenceEvent({ userId: alice, type: 'offline', occurredAt: at(23) }),
    )
    const events = await repo.listByUserInWindow(alice, at(0), at(28))
    expect(events.map((e) => e.type)).toEqual(['online', 'offline'])
  })

  it('filters by [from, to) window', async () => {
    const repo = createInMemoryPresenceEventRepository()
    await repo.record(
      createPresenceEvent({ userId: alice, type: 'online', occurredAt: at(22) }),
    )
    await repo.record(
      createPresenceEvent({ userId: alice, type: 'offline', occurredAt: at(28) }),
    )
    const events = await repo.listByUserInWindow(alice, at(22), at(28))
    expect(events.map((e) => e.type)).toEqual(['online'])
  })

  it('filters by userId', async () => {
    const repo = createInMemoryPresenceEventRepository()
    await repo.record(
      createPresenceEvent({ userId: alice, type: 'online', occurredAt: at(22) }),
    )
    await repo.record(
      createPresenceEvent({ userId: bob, type: 'online', occurredAt: at(22) }),
    )
    const events = await repo.listByUserInWindow(alice, at(20), at(28))
    expect(events.length).toBe(1)
    expect(events[0]?.userId).toBe(alice)
  })
})
