import { describe, expect, it } from 'vitest'
import {
  createTyping,
  ForbiddenError,
  type ConversationId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  inMemoryTypingRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createClearTyping } from './clear-typing'

const alice = 'u_alice' as UserId

describe('clearTyping', () => {
  it('removes the typing record', async () => {
    const typingRepo = inMemoryTypingRepo()
    typingRepo.state.set(
      `c1:${alice}`,
      createTyping({
        conversationId: 'c1' as ConversationId,
        userId: alice,
        startedAt: jst(2026, 5, 26, 2, 30),
      }),
    )

    const clear = createClearTyping({
      typingRepository: typingRepo.repo,
      businessHoursGuard: openGuard,
    })

    await clear({ conversationId: 'c1' as ConversationId, userId: alice })
    expect(typingRepo.state.size).toBe(0)
  })

  it('is a no-op when there is no typing record (idempotent)', async () => {
    const typingRepo = inMemoryTypingRepo()
    const clear = createClearTyping({
      typingRepository: typingRepo.repo,
      businessHoursGuard: openGuard,
    })

    await expect(
      clear({ conversationId: 'c1' as ConversationId, userId: alice }),
    ).resolves.toBeUndefined()
  })

  it('throws ForbiddenError outside business hours', async () => {
    const typingRepo = inMemoryTypingRepo()
    const clear = createClearTyping({
      typingRepository: typingRepo.repo,
      businessHoursGuard: closedGuard,
    })

    await expect(
      clear({ conversationId: 'c1' as ConversationId, userId: alice }),
    ).rejects.toThrow(ForbiddenError)
  })
})
