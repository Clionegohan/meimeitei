import { describe, expect, it } from 'vitest'
import {
  createConversation,
  type ConversationId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import { createInMemoryConversationRepository } from './conversation-repository'

const a = 'u_a' as UserId
const b = 'u_b' as UserId
const c = 'u_c' as UserId

const seedConv = (
  id: string,
  p1: UserId,
  p2: UserId,
  rootPostId: PostId | null = null,
) =>
  createConversation({
    id: id as ConversationId,
    participants: [p1, p2],
    rootPostId,
    openedAt: new Date('2026-05-26T02:00:00Z'),
  })

describe('InMemoryConversationRepository', () => {
  it('saves and retrieves by id', async () => {
    const repo = createInMemoryConversationRepository()
    const conv = seedConv('c1', a, b)
    await repo.save(conv)
    expect(await repo.findById('c1' as ConversationId)).toBe(conv)
  })

  it('findByPair matches sorted pair + same rootPostId (null)', async () => {
    const repo = createInMemoryConversationRepository()
    const conv = seedConv('c1', a, b, null)
    await repo.save(conv)
    // input order reversed
    expect((await repo.findByPair([b, a], null))?.id).toBe('c1')
  })

  it('findByPair distinguishes by rootPostId', async () => {
    const repo = createInMemoryConversationRepository()
    const r2 = seedConv('c1', a, b, null)
    const r1 = seedConv('c2', a, b, 'p1' as PostId)
    await repo.save(r2)
    await repo.save(r1)
    expect((await repo.findByPair([a, b], null))?.id).toBe('c1')
    expect((await repo.findByPair([a, b], 'p1' as PostId))?.id).toBe('c2')
  })

  it('listByUser returns conversations the user participates in', async () => {
    const repo = createInMemoryConversationRepository()
    await repo.save(seedConv('c1', a, b))
    await repo.save(seedConv('c2', a, c))
    await repo.save(seedConv('c3', b, c))
    const result = await repo.listByUser(a)
    expect(result.map((x) => x.id).sort()).toEqual(['c1', 'c2'])
  })
})
