import { describe, expect, it } from 'vitest'
import type { UserId } from '../shared/id'
import type { NightId } from '../shared/time'
import { createLoginRecord, type LoginRecord } from './login-history'

const userId = 'u_alice' as UserId
const nightId = '2026-05-25' as NightId

describe('createLoginRecord', () => {
  it('builds a record with the supplied fields', () => {
    const r: LoginRecord = createLoginRecord({
      userId,
      nightId,
      at: new Date('2026-05-25T13:30:00Z'),
    })
    expect(r.userId).toBe(userId)
    expect(r.nightId).toBe(nightId)
    expect(r.firstSeenAt.toISOString()).toBe('2026-05-25T13:30:00.000Z')
  })
})
