import { describe, expect, it } from 'vitest'
import { createTyping, type ConversationId, type UserId } from '@me-me-en/domain'
import { createInMemoryTypingRepository } from './typing-repository'

const conv = 'c1' as ConversationId
const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

const seed = (c: ConversationId, u: UserId, startedAt: Date) =>
  createTyping({ conversationId: c, userId: u, startedAt })

describe('InMemoryTypingRepository', () => {
  it('sets and retrieves typing per (conv, user)', async () => {
    const repo = createInMemoryTypingRepository()
    const t = seed(conv, alice, new Date('2026-05-26T02:00:00Z'))
    await repo.set(t)
    expect(await repo.findByConversationAndUser(conv, alice)).toBe(t)
  })

  it('clear removes the typing record', async () => {
    const repo = createInMemoryTypingRepository()
    await repo.set(seed(conv, alice, new Date('2026-05-26T02:00:00Z')))
    await repo.clear(conv, alice)
    expect(await repo.findByConversationAndUser(conv, alice)).toBeNull()
  })

  it('listActiveByConversation drops entries past 5s TTL', async () => {
    const repo = createInMemoryTypingRepository()
    const now = new Date('2026-05-26T02:00:10Z')
    await repo.set(seed(conv, alice, new Date('2026-05-26T02:00:06Z'))) // 4s ago — active
    await repo.set(seed(conv, bob, new Date('2026-05-26T02:00:04Z'))) // 6s ago — expired
    const result = await repo.listActiveByConversation(conv, now)
    expect(result.map((t) => t.userId)).toEqual([alice])
  })

  it('listActiveByConversation filters by conversationId', async () => {
    const repo = createInMemoryTypingRepository()
    const now = new Date('2026-05-26T02:00:10Z')
    await repo.set(seed(conv, alice, new Date('2026-05-26T02:00:08Z')))
    await repo.set(seed('c2' as ConversationId, bob, new Date('2026-05-26T02:00:08Z')))
    const result = await repo.listActiveByConversation(conv, now)
    expect(result.map((t) => t.userId)).toEqual([alice])
  })
})
