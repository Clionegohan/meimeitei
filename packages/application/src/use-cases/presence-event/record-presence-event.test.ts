import { describe, expect, it } from 'vitest'
import type { UserId } from '@me-me-en/domain'
import {
  fixedClock,
  inMemoryPresenceEventRepo,
  jst,
} from '../../__test-helpers__/fakes'
import { createRecordPresenceEvent } from './record-presence-event'

const alice = 'u_alice' as UserId

describe('recordPresenceEvent', () => {
  it('appends an online event with the clock timestamp', async () => {
    const { repo, state } = inMemoryPresenceEventRepo()
    const record = createRecordPresenceEvent({
      presenceEventRepository: repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
    })
    await record({ userId: alice, type: 'online' })
    expect(state).toHaveLength(1)
    expect(state[0]?.userId).toBe(alice)
    expect(state[0]?.type).toBe('online')
    expect(state[0]?.occurredAt.toISOString()).toBe(jst(2026, 5, 26, 2, 0).toISOString())
  })

  it('records offline events too — used by the 05:00 force-disconnect path', async () => {
    const { repo, state } = inMemoryPresenceEventRepo()
    const record = createRecordPresenceEvent({
      presenceEventRepository: repo,
      clock: fixedClock(jst(2026, 5, 26, 5, 0)),
    })
    await record({ userId: alice, type: 'offline' })
    expect(state[0]?.type).toBe('offline')
  })
})
