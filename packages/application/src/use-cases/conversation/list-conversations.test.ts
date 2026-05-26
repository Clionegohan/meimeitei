import { describe, expect, it } from 'vitest'
import {
  createConversation,
  ForbiddenError,
  type BlockId,
  type ConversationId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  inMemoryBlockRepo,
  inMemoryConversationRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createListConversations } from './list-conversations'

const me = 'u_alice' as UserId
const bob = 'u_bob' as UserId
const carol = 'u_carol' as UserId

const seedConv = (id: string, a: UserId, b: UserId, rootPostId: null = null) =>
  createConversation({
    id: id as ConversationId,
    participants: [a, b],
    rootPostId,
    openedAt: jst(2026, 5, 26, 2, 0),
  })

describe('listConversations', () => {
  it('returns conversations involving the user', async () => {
    const convRepo = inMemoryConversationRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', me, bob))
    convRepo.state.push(seedConv('c2', me, carol))
    convRepo.state.push(seedConv('c3', bob, carol)) // not involving me

    const list = createListConversations({
      conversationRepository: convRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ userId: me })
    expect(result.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
  })

  it('excludes conversations with blocked counterparts (either direction)', async () => {
    const convRepo = inMemoryConversationRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', me, bob))
    convRepo.state.push(seedConv('c2', me, carol))
    // me blocks bob
    blockRepo.state.push({
      id: 'b1' as BlockId,
      blockerId: me,
      blockedId: bob,
      createdAt: jst(2026, 5, 26, 1, 0),
    })

    const list = createListConversations({
      conversationRepository: convRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ userId: me })
    expect(result.map((c) => c.id)).toEqual(['c2'])
  })

  it('throws ForbiddenError outside business hours', async () => {
    const convRepo = inMemoryConversationRepo()
    const blockRepo = inMemoryBlockRepo()

    const list = createListConversations({
      conversationRepository: convRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: closedGuard,
    })

    await expect(list({ userId: me })).rejects.toThrow(ForbiddenError)
  })

  it('returns empty array when user has no conversations', async () => {
    const convRepo = inMemoryConversationRepo()
    const blockRepo = inMemoryBlockRepo()

    const list = createListConversations({
      conversationRepository: convRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ userId: me })
    expect(result).toEqual([])
  })
})
