import { describe, expect, it } from 'vitest'
import type { ConversationId, UserId } from '../shared/id'
import { createTyping, hasExpired, TYPING_TTL_MS, type Typing } from './typing'

const convId = 'c1' as ConversationId
const userA = 'u_alpha' as UserId
const startedAt = new Date('2026-05-26T02:00:00Z')

describe('createTyping', () => {
  it('creates a typing record', () => {
    const t: Typing = createTyping({ conversationId: convId, userId: userA, startedAt })
    expect(t.conversationId).toBe('c1')
    expect(t.userId).toBe('u_alpha')
    expect(t.startedAt.toISOString()).toBe('2026-05-26T02:00:00.000Z')
  })
})

describe('hasExpired', () => {
  const t = createTyping({ conversationId: convId, userId: userA, startedAt })

  it('false within TTL', () => {
    const now = new Date(startedAt.getTime() + 4_000)
    expect(hasExpired(t, now)).toBe(false)
  })

  it('true past TTL', () => {
    const now = new Date(startedAt.getTime() + 6_000)
    expect(hasExpired(t, now)).toBe(true)
  })

  it('true exactly at TTL boundary', () => {
    const now = new Date(startedAt.getTime() + TYPING_TTL_MS)
    expect(hasExpired(t, now)).toBe(true)
  })

  it('false at startedAt itself', () => {
    expect(hasExpired(t, startedAt)).toBe(false)
  })
})

describe('TYPING_TTL_MS', () => {
  it('exposes the 5-second TTL constant', () => {
    expect(TYPING_TTL_MS).toBe(5_000)
  })
})
