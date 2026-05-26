import { describe, expect, it } from 'vitest'
import {
  createConversation,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  type BlockId,
  type ConversationId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryBlockRepo,
  inMemoryConversationRepo,
  inMemoryMessageRepo,
  jst,
  openGuard,
  sequentialIdGen,
} from '../../__test-helpers__/fakes'
import { createSendMessage } from './send-message'

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

describe('sendMessage', () => {
  it('persists a message in an existing conversation', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const send = createSendMessage({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const msg = await send({
      senderId: alice,
      conversationId: 'c1' as ConversationId,
      body: 'こんばんは',
    })

    expect(msg.senderId).toBe(alice)
    expect(msg.body).toBe('こんばんは')
    expect(msg.readAt).toBeNull()
    expect(msg.deletedAt).toBeNull()
    expect(msgRepo.state.length).toBe(1)
  })

  it('throws NotFoundError when conversation does not exist', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    const blockRepo = inMemoryBlockRepo()

    const send = createSendMessage({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      send({ senderId: alice, conversationId: 'ghost' as ConversationId, body: 'x' }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when sender is not a participant', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const send = createSendMessage({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      send({ senderId: carol, conversationId: 'c1' as ConversationId, body: 'x' }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError when the counterpart has blocked sender', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))
    blockRepo.state.push({
      id: 'b1' as BlockId,
      blockerId: bob,
      blockedId: alice,
      createdAt: jst(2026, 5, 26, 1, 0),
    })

    const send = createSendMessage({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      send({ senderId: alice, conversationId: 'c1' as ConversationId, body: 'x' }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const send = createSendMessage({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: closedGuard,
    })

    await expect(
      send({ senderId: alice, conversationId: 'c1' as ConversationId, body: 'x' }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('propagates createMessage validation (empty body)', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    const blockRepo = inMemoryBlockRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const send = createSendMessage({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      send({ senderId: alice, conversationId: 'c1' as ConversationId, body: '' }),
    ).rejects.toThrow(ValidationError)
  })
})
