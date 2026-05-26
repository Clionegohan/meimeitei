import { describe, expect, it } from 'vitest'
import {
  createMessage,
  type ConversationId,
  type MessageId,
  type UserId,
} from '@me-me-en/domain'
import { createInMemoryMessageRepository } from './message-repository'

const conv = 'c1' as ConversationId
const alice = 'u_alice' as UserId

const seedMsg = (id: string, body: string, sentAt: Date) =>
  createMessage({
    id: id as MessageId,
    conversationId: conv,
    senderId: alice,
    body,
    sentAt,
  })

describe('InMemoryMessageRepository', () => {
  it('saves and retrieves by id', async () => {
    const repo = createInMemoryMessageRepository()
    const m = seedMsg('m1', 'hi', new Date('2026-05-26T02:00:00Z'))
    await repo.save(m)
    expect(await repo.findById('m1' as MessageId)).toBe(m)
  })

  it('listByConversation returns messages ascending by sentAt', async () => {
    const repo = createInMemoryMessageRepository()
    await repo.save(seedMsg('m2', 'b', new Date('2026-05-26T02:20:00Z')))
    await repo.save(seedMsg('m1', 'a', new Date('2026-05-26T02:10:00Z')))
    const result = await repo.listByConversation({ conversationId: conv })
    expect(result.map((m) => m.id)).toEqual(['m1', 'm2'])
  })

  it('before/limit applies cursor pagination', async () => {
    const repo = createInMemoryMessageRepository()
    for (let i = 1; i <= 5; i++) {
      await repo.save(seedMsg(`m${i}`, `${i}`, new Date(`2026-05-26T02:0${i}:00Z`)))
    }
    const result = await repo.listByConversation({
      conversationId: conv,
      before: new Date('2026-05-26T02:04:00Z'),
      limit: 2,
    })
    expect(result.map((m) => m.id)).toEqual(['m1', 'm2'])
  })
})
