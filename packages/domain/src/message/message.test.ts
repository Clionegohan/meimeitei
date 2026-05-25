import { describe, expect, it } from 'vitest'
import { ValidationError } from '../shared/errors'
import type { ConversationId, MessageId, UserId } from '../shared/id'
import { createMessage, markAsDeleted, markAsRead, type Message } from './message'

const baseInput = {
  id: 'm1' as MessageId,
  conversationId: 'c1' as ConversationId,
  senderId: 'u1' as UserId,
  body: 'こんばんは',
  sentAt: new Date('2026-05-26T02:00:00Z'),
}

describe('createMessage', () => {
  it('creates a message with null readAt and deletedAt', () => {
    const m: Message = createMessage(baseInput)
    expect(m.id).toBe('m1')
    expect(m.conversationId).toBe('c1')
    expect(m.senderId).toBe('u1')
    expect(m.body).toBe('こんばんは')
    expect(m.sentAt.toISOString()).toBe('2026-05-26T02:00:00.000Z')
    expect(m.readAt).toBeNull()
    expect(m.deletedAt).toBeNull()
  })

  it('rejects empty body', () => {
    expect(() => createMessage({ ...baseInput, body: '' })).toThrow(ValidationError)
  })

  it('rejects whitespace-only body', () => {
    expect(() => createMessage({ ...baseInput, body: '   ' })).toThrow(ValidationError)
    expect(() => createMessage({ ...baseInput, body: '　　' })).toThrow(ValidationError)
  })

  it('rejects body longer than 280 graphemes', () => {
    const long = 'あ'.repeat(281)
    expect(() => createMessage({ ...baseInput, body: long })).toThrow(ValidationError)
  })

  it('accepts body of exactly 280 graphemes', () => {
    const max = 'あ'.repeat(280)
    const m = createMessage({ ...baseInput, body: max })
    expect(m.body).toBe(max)
  })

  it('preserves newlines in body', () => {
    const body = '一行目\n二行目\n三行目'
    const m = createMessage({ ...baseInput, body })
    expect(m.body).toBe(body)
  })
})

describe('markAsRead', () => {
  it('returns a new message with readAt set', () => {
    const m = createMessage(baseInput)
    const readAt = new Date('2026-05-26T02:05:00Z')
    const m2 = markAsRead(m, readAt)
    expect(m2.readAt?.toISOString()).toBe('2026-05-26T02:05:00.000Z')
    expect(m2).not.toBe(m) // new instance
    expect(m.readAt).toBeNull() // original unchanged
  })

  it('is idempotent — returns the same instance if already read', () => {
    const m1 = createMessage(baseInput)
    const m2 = markAsRead(m1, new Date('2026-05-26T02:05:00Z'))
    const m3 = markAsRead(m2, new Date('2026-05-26T02:10:00Z'))
    expect(m3).toBe(m2)
  })
})

describe('markAsDeleted', () => {
  it('returns a new message with deletedAt set', () => {
    const m = createMessage(baseInput)
    const deletedAt = new Date('2026-05-26T03:00:00Z')
    const m2 = markAsDeleted(m, deletedAt)
    expect(m2.deletedAt?.toISOString()).toBe('2026-05-26T03:00:00.000Z')
    expect(m2).not.toBe(m)
    expect(m.deletedAt).toBeNull()
  })

  it('is idempotent — returns the same instance if already deleted', () => {
    const m1 = createMessage(baseInput)
    const m2 = markAsDeleted(m1, new Date('2026-05-26T03:00:00Z'))
    const m3 = markAsDeleted(m2, new Date('2026-05-26T03:05:00Z'))
    expect(m3).toBe(m2)
  })

  it('keeps readAt intact when deleting', () => {
    const m1 = createMessage(baseInput)
    const m2 = markAsRead(m1, new Date('2026-05-26T02:05:00Z'))
    const m3 = markAsDeleted(m2, new Date('2026-05-26T03:00:00Z'))
    expect(m3.readAt?.toISOString()).toBe('2026-05-26T02:05:00.000Z')
    expect(m3.deletedAt?.toISOString()).toBe('2026-05-26T03:00:00.000Z')
  })
})
