import { describe, expect, it } from 'vitest'
import {
  createUser,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  type BlockId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryBlockRepo,
  inMemoryConversationRepo,
  inMemoryUserRepo,
  jst,
  openGuard,
  sequentialIdGen,
} from '../../__test-helpers__/fakes'
import { createStartConversationDirect } from './start-conversation-direct'

const initiator = 'u_alice' as UserId
const partner = 'u_bob' as UserId

const seedUser = (id: string, nickname: string) =>
  createUser({
    id: id as UserId,
    nickname,
    joinedAt: jst(2026, 5, 26, 2, 0),
  })

describe('startConversationDirect (R2)', () => {
  it('creates a new R2 conversation with rootPostId null', async () => {
    const convRepo = inMemoryConversationRepo()
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    userRepo.state.push(seedUser('u_bob', 'bob'))

    const start = createStartConversationDirect({
      conversationRepository: convRepo.repo,
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const conv = await start({ initiatorId: initiator, partnerId: partner })

    expect(conv.rootPostId).toBeNull()
    expect(conv.participantIds).toEqual([initiator, partner].sort())
    expect(convRepo.state.length).toBe(1)
  })

  it('reuses the existing R2 conversation for the same pair', async () => {
    const convRepo = inMemoryConversationRepo()
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    userRepo.state.push(seedUser('u_bob', 'bob'))

    const start = createStartConversationDirect({
      conversationRepository: convRepo.repo,
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const first = await start({ initiatorId: initiator, partnerId: partner })
    const second = await start({ initiatorId: initiator, partnerId: partner })

    expect(second.id).toBe(first.id)
    expect(convRepo.state.length).toBe(1)
  })

  it('throws ValidationError when initiator == partner (self-DM)', async () => {
    const convRepo = inMemoryConversationRepo()
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    userRepo.state.push(seedUser('u_alice', 'alice'))

    const start = createStartConversationDirect({
      conversationRepository: convRepo.repo,
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      start({ initiatorId: initiator, partnerId: initiator }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws NotFoundError when partner does not exist', async () => {
    const convRepo = inMemoryConversationRepo()
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()

    const start = createStartConversationDirect({
      conversationRepository: convRepo.repo,
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      start({ initiatorId: initiator, partnerId: 'ghost' as UserId }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when blocked in either direction', async () => {
    const convRepo = inMemoryConversationRepo()
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    userRepo.state.push(seedUser('u_bob', 'bob'))
    blockRepo.state.push({
      id: 'b1' as BlockId,
      blockerId: initiator,
      blockedId: partner,
      createdAt: jst(2026, 5, 26, 1, 0),
    })

    const start = createStartConversationDirect({
      conversationRepository: convRepo.repo,
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      start({ initiatorId: initiator, partnerId: partner }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const convRepo = inMemoryConversationRepo()
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    userRepo.state.push(seedUser('u_bob', 'bob'))

    const start = createStartConversationDirect({
      conversationRepository: convRepo.repo,
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: closedGuard,
    })

    await expect(
      start({ initiatorId: initiator, partnerId: partner }),
    ).rejects.toThrow(ForbiddenError)
  })
})
