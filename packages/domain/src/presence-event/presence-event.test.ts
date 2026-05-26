import { describe, expect, it } from 'vitest'
import type { UserId } from '../shared/id'
import { createPresenceEvent, type PresenceEvent } from './presence-event'

const userId = 'u_alice' as UserId

describe('createPresenceEvent', () => {
  it('builds an online event', () => {
    const e: PresenceEvent = createPresenceEvent({
      userId,
      type: 'online',
      occurredAt: new Date('2026-05-26T02:00:00Z'),
    })
    expect(e.userId).toBe(userId)
    expect(e.type).toBe('online')
    expect(e.occurredAt.toISOString()).toBe('2026-05-26T02:00:00.000Z')
  })

  it('builds an offline event', () => {
    const e = createPresenceEvent({
      userId,
      type: 'offline',
      occurredAt: new Date('2026-05-26T04:30:00Z'),
    })
    expect(e.type).toBe('offline')
  })
})
