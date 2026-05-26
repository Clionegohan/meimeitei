import { describe, expect, it } from 'vitest'
import {
  createConversation,
  createMessage,
  ForbiddenError,
  NotFoundError,
  type ConversationId,
  type MessageId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  inMemoryConversationRepo,
  inMemoryMessageRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createListMessages } from './list-messages'

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

const seedMsg = (
  id: string,
  convId: string,
  sender: UserId,
  body: string,
  sentAt: Date,
) =>
  createMessage({
    id: id as MessageId,
    conversationId: convId as ConversationId,
    senderId: sender,
    body,
    sentAt,
  })

describe('listMessages', () => {
  it('returns messages of the conversation in ascending sentAt', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    convRepo.state.push(seedConv('c1', alice, bob))
    msgRepo.state.push(seedMsg('m2', 'c1', alice, '二', jst(2026, 5, 26, 2, 20)))
    msgRepo.state.push(seedMsg('m1', 'c1', alice, '一', jst(2026, 5, 26, 2, 10)))

    const list = createListMessages({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ viewerId: bob, conversationId: 'c1' as ConversationId })
    expect(result.map((m) => m.id)).toEqual(['m1', 'm2'])
  })

  it('throws NotFoundError when conversation does not exist', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()

    const list = createListMessages({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      businessHoursGuard: openGuard,
    })

    await expect(
      list({ viewerId: bob, conversationId: 'ghost' as ConversationId }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when viewer is not a participant', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const list = createListMessages({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      businessHoursGuard: openGuard,
    })

    await expect(
      list({ viewerId: carol, conversationId: 'c1' as ConversationId }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('applies before/limit pagination', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    convRepo.state.push(seedConv('c1', alice, bob))
    for (let i = 1; i <= 5; i++) {
      msgRepo.state.push(seedMsg(`m${i}`, 'c1', alice, `body ${i}`, jst(2026, 5, 26, 2, i)))
    }

    const list = createListMessages({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({
      viewerId: bob,
      conversationId: 'c1' as ConversationId,
      before: jst(2026, 5, 26, 2, 4),
      limit: 2,
    })
    // before excludes m4/m5 and applies limit
    expect(result.map((m) => m.id)).toEqual(['m1', 'm2'])
  })

  it('throws ForbiddenError outside business hours', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    convRepo.state.push(seedConv('c1', alice, bob))

    const list = createListMessages({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      businessHoursGuard: closedGuard,
    })

    await expect(
      list({ viewerId: bob, conversationId: 'c1' as ConversationId }),
    ).rejects.toThrow(ForbiddenError)
  })
})
