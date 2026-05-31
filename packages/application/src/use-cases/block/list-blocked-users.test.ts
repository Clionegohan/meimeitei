import { describe, expect, it } from 'vitest'
import { createBlock, createUser, type BlockId, type UserId } from '@me-me-en/domain'
import { createListBlockedUsers } from './list-blocked-users'
import {
  closedGuard,
  inMemoryBlockRepo,
  inMemoryUserRepo,
  openGuard,
} from '../../__test-helpers__/fakes'

const mkUser = (id: string, nickname: string) =>
  createUser({
    id: id as UserId,
    nickname,
    joinedAt: new Date('2025-08-03T13:00:00Z'),
  })

const mkBlock = (id: string, blocker: string, blocked: string) =>
  createBlock({
    id: id as BlockId,
    blockerId: blocker as UserId,
    blockedId: blocked as UserId,
    createdAt: new Date('2025-08-04T13:00:00Z'),
  })

describe('listBlockedUsers', () => {
  it('returns the users the viewer has blocked', async () => {
    const { repo: userRepo, state: users } = inMemoryUserRepo()
    const { repo: blockRepo, state: blocks } = inMemoryBlockRepo()
    users.push(mkUser('me', '己'), mkUser('a', 'alpha'), mkUser('b', 'bravo'))
    blocks.push(mkBlock('blk1', 'me', 'a'), mkBlock('blk2', 'me', 'b'))

    const list = createListBlockedUsers({
      blockRepository: blockRepo,
      userRepository: userRepo,
      businessHoursGuard: openGuard,
    })
    const result = await list({ viewerId: 'me' as UserId })
    expect(result.map((u) => u.id).sort()).toEqual(['a', 'b'])
  })

  it('does not return users who blocked the viewer (one-directional)', async () => {
    const { repo: userRepo, state: users } = inMemoryUserRepo()
    const { repo: blockRepo, state: blocks } = inMemoryBlockRepo()
    users.push(mkUser('me', '己'), mkUser('a', 'alpha'))
    blocks.push(mkBlock('blk1', 'a', 'me')) // a blocks me, not the reverse

    const list = createListBlockedUsers({
      blockRepository: blockRepo,
      userRepository: userRepo,
      businessHoursGuard: openGuard,
    })
    expect(await list({ viewerId: 'me' as UserId })).toEqual([])
  })

  it('skips blocked ids whose user record no longer exists', async () => {
    const { repo: userRepo, state: users } = inMemoryUserRepo()
    const { repo: blockRepo, state: blocks } = inMemoryBlockRepo()
    users.push(mkUser('me', '己'))
    blocks.push(mkBlock('blk1', 'me', 'gone'))

    const list = createListBlockedUsers({
      blockRepository: blockRepo,
      userRepository: userRepo,
      businessHoursGuard: openGuard,
    })
    expect(await list({ viewerId: 'me' as UserId })).toEqual([])
  })

  it('throws outside business hours', async () => {
    const { repo: userRepo } = inMemoryUserRepo()
    const { repo: blockRepo } = inMemoryBlockRepo()
    const list = createListBlockedUsers({
      blockRepository: blockRepo,
      userRepository: userRepo,
      businessHoursGuard: closedGuard,
    })
    await expect(list({ viewerId: 'me' as UserId })).rejects.toThrow()
  })
})
