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
  fixedClock,
  inMemoryConversationRepo,
  inMemoryMessageRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createMarkAsRead } from './mark-as-read'

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

const seedMsg = (id: string, convId: string, sender: UserId, body: string) =>
  createMessage({
    id: id as MessageId,
    conversationId: convId as ConversationId,
    senderId: sender,
    body,
    sentAt: jst(2026, 5, 26, 2, 10),
  })

describe('markAsRead', () => {
  it('sets readAt on the message', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    convRepo.state.push(seedConv('c1', alice, bob))
    msgRepo.state.push(seedMsg('m1', 'c1', alice, 'こんばんは'))

    const mark = createMarkAsRead({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      businessHoursGuard: openGuard,
    })

    const updated = await mark({ readerId: bob, messageId: 'm1' as MessageId })
    expect(updated.readAt?.toISOString()).toBe('2026-05-25T17:30:00.000Z')
    expect(msgRepo.state[0]?.readAt?.toISOString()).toBe('2026-05-25T17:30:00.000Z')
  })

  it('is idempotent (already-read returns the existing message)', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    convRepo.state.push(seedConv('c1', alice, bob))
    msgRepo.state.push(seedMsg('m1', 'c1', alice, 'x'))

    const mark = createMarkAsRead({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      businessHoursGuard: openGuard,
    })

    const first = await mark({ readerId: bob, messageId: 'm1' as MessageId })
    const second = await mark({ readerId: bob, messageId: 'm1' as MessageId })
    expect(second.readAt?.toISOString()).toBe(first.readAt?.toISOString())
  })

  it('throws NotFoundError when message does not exist', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()

    const mark = createMarkAsRead({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      businessHoursGuard: openGuard,
    })

    await expect(
      mark({ readerId: bob, messageId: 'ghost' as MessageId }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when reader is not a participant', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    convRepo.state.push(seedConv('c1', alice, bob))
    msgRepo.state.push(seedMsg('m1', 'c1', alice, 'x'))

    const mark = createMarkAsRead({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 30)),
      businessHoursGuard: openGuard,
    })

    await expect(
      mark({ readerId: carol, messageId: 'm1' as MessageId }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const convRepo = inMemoryConversationRepo()
    const msgRepo = inMemoryMessageRepo()
    convRepo.state.push(seedConv('c1', alice, bob))
    msgRepo.state.push(seedMsg('m1', 'c1', alice, 'x'))

    const mark = createMarkAsRead({
      conversationRepository: convRepo.repo,
      messageRepository: msgRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      businessHoursGuard: closedGuard,
    })

    await expect(
      mark({ readerId: bob, messageId: 'm1' as MessageId }),
    ).rejects.toThrow(ForbiddenError)
  })
})
