import { describe, expect, it } from 'vitest'
import {
  createConversation,
  ForbiddenError,
  NotFoundError,
  type BlockId,
  type ConversationId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryBlockRepo,
  inMemoryConversationRepo,
  inMemoryTypingRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createUpdateTyping } from './update-typing'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId
const carol = 'u_carol' as UserId

const seedConv = (id: string, a: UserId, b: UserId) =>
  createConversation({
    id: id as ConversationId,
    participants: [a, b],
    rootPostId: null,
    openedAt: jst(2026, 5, 26, 2, 0),
  })

describe('updateTyping', () => {
  it('persists a typing record for a conversation participant', async () => {
    const convRepo = inMemoryConversationRepo()
    const typingRepo = inMemoryTypingRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const update = createUpdateTyping({
      conversationRepository: convRepo.repo,
      typingRepository: typingRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      businessHoursGuard: openGuard,
    })

    const t = await update({ conversationId: 'c1' as ConversationId, userId: alice })
    expect(t.conversationId).toBe('c1')
    expect(t.userId).toBe(alice)
    expect(typingRepo.state.size).toBe(1)
  })

  it('throws NotFoundError when conversation does not exist', async () => {
    const convRepo = inMemoryConversationRepo()
    const typingRepo = inMemoryTypingRepo()
    const blockRepo = inMemoryBlockRepo()

    const update = createUpdateTyping({
      conversationRepository: convRepo.repo,
      typingRepository: typingRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      businessHoursGuard: openGuard,
    })

    await expect(
      update({ conversationId: 'ghost' as ConversationId, userId: alice }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when user is not a participant', async () => {
    const convRepo = inMemoryConversationRepo()
    const typingRepo = inMemoryTypingRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const update = createUpdateTyping({
      conversationRepository: convRepo.repo,
      typingRepository: typingRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      businessHoursGuard: openGuard,
    })

    await expect(
      update({ conversationId: 'c1' as ConversationId, userId: carol }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError when there is a block between participants', async () => {
    const convRepo = inMemoryConversationRepo()
    const typingRepo = inMemoryTypingRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))
    blockRepo.state.push({
      id: 'b1' as BlockId,
      blockerId: bob,
      blockedId: alice,
      createdAt: jst(2026, 5, 26, 1, 0),
    })

    const update = createUpdateTyping({
      conversationRepository: convRepo.repo,
      typingRepository: typingRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      businessHoursGuard: openGuard,
    })

    await expect(
      update({ conversationId: 'c1' as ConversationId, userId: alice }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const convRepo = inMemoryConversationRepo()
    const typingRepo = inMemoryTypingRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const update = createUpdateTyping({
      conversationRepository: convRepo.repo,
      typingRepository: typingRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      businessHoursGuard: closedGuard,
    })

    await expect(
      update({ conversationId: 'c1' as ConversationId, userId: alice }),
    ).rejects.toThrow(ForbiddenError)
  })
})
