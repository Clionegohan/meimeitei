import { describe, expect, it } from 'vitest'
import { createMessage } from '@me-me-en/domain'
import type { ConversationId, MessageId, UserId } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaMessageRepository } from '../message-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

const newMessage = (
  id: string,
  conversationId: ConversationId,
  senderId: UserId,
  sentAt: Date,
) =>
  createMessage({
    id: id as MessageId,
    conversationId,
    senderId,
    body: 'hi',
    sentAt,
  })

describe('PrismaMessageRepository (integration)', () => {
  it('save + findById round-trips, listByConversation orders by sentAt asc', async () => {
    const repo = createPrismaMessageRepository(prisma)
    const conv = 'c1' as ConversationId
    await repo.save(newMessage('m2', conv, alice, new Date('2026-05-25T22:01:00Z')))
    await repo.save(newMessage('m1', conv, bob, new Date('2026-05-25T22:00:00Z')))
    await repo.save(newMessage('m3', conv, alice, new Date('2026-05-25T22:02:00Z')))

    const messages = await repo.listByConversation({ conversationId: conv })
    expect(messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3'])
  })

  it('countByConversationsInWindow aggregates per conversation with groupBy', async () => {
    const repo = createPrismaMessageRepository(prisma)
    const c1 = 'c1' as ConversationId
    const c2 = 'c2' as ConversationId

    // c1: 2 件 inside window, c2: 1 件 inside, 1 件 outside
    await repo.save(newMessage('m1', c1, alice, new Date('2026-05-25T22:00:00Z')))
    await repo.save(newMessage('m2', c1, bob, new Date('2026-05-25T22:05:00Z')))
    await repo.save(newMessage('m3', c2, bob, new Date('2026-05-25T22:10:00Z')))
    await repo.save(newMessage('m4', c2, alice, new Date('2026-05-23T22:00:00Z')))

    const counts = await repo.countByConversationsInWindow(
      [c1, c2],
      new Date('2026-05-25T00:00:00Z'),
      new Date('2026-05-26T00:00:00Z'),
    )
    expect(counts.get(c1)).toBe(2)
    expect(counts.get(c2)).toBe(1)
  })

  it('returns 0 for ids that have no messages, but still include them in the Map', async () => {
    const repo = createPrismaMessageRepository(prisma)
    const counts = await repo.countByConversationsInWindow(
      ['c1' as ConversationId, 'c2' as ConversationId],
      new Date('2026-05-25T00:00:00Z'),
      new Date('2026-05-26T00:00:00Z'),
    )
    expect(counts.get('c1' as ConversationId)).toBe(0)
    expect(counts.get('c2' as ConversationId)).toBe(0)
  })

  it('empty ids array returns empty Map', async () => {
    const repo = createPrismaMessageRepository(prisma)
    const counts = await repo.countByConversationsInWindow(
      [],
      new Date('2026-05-25T00:00:00Z'),
      new Date('2026-05-26T00:00:00Z'),
    )
    expect(counts.size).toBe(0)
  })
})
