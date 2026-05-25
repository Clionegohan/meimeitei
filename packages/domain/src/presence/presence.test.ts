import { describe, expect, it } from 'vitest'
import type { UserId } from '../shared/id'
import { createPresence, visibleStatusTo, type Presence } from './presence'

const userA = 'u_alpha' as UserId
const lastSeen = new Date('2026-05-26T02:00:00Z')

describe('createPresence', () => {
  it('creates an online presence', () => {
    const p: Presence = createPresence({
      userId: userA,
      status: 'online',
      lastSeenAt: lastSeen,
    })
    expect(p.userId).toBe('u_alpha')
    expect(p.status).toBe('online')
    expect(p.lastSeenAt.toISOString()).toBe('2026-05-26T02:00:00.000Z')
  })

  it('creates an offline presence', () => {
    const p = createPresence({ userId: userA, status: 'offline', lastSeenAt: lastSeen })
    expect(p.status).toBe('offline')
  })
})

describe('visibleStatusTo — asymmetric stealth', () => {
  const p = createPresence({ userId: userA, status: 'online', lastSeenAt: lastSeen })

  it('visible owner: viewer sees actual status', () => {
    expect(
      visibleStatusTo(p, { ownerVisibility: 'visible', viewerIsOwner: false }),
    ).toBe('online')
  })

  it('invisible owner: viewer sees offline (even if actually online)', () => {
    expect(
      visibleStatusTo(p, { ownerVisibility: 'invisible', viewerIsOwner: false }),
    ).toBe('offline')
  })

  it('invisible owner: owner themselves see actual status', () => {
    expect(
      visibleStatusTo(p, { ownerVisibility: 'invisible', viewerIsOwner: true }),
    ).toBe('online')
  })

  it('visible owner: owner sees actual status', () => {
    expect(
      visibleStatusTo(p, { ownerVisibility: 'visible', viewerIsOwner: true }),
    ).toBe('online')
  })
})
