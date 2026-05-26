import { describe, expect, it } from 'vitest'
import {
  createPresence,
  createUser,
  ForbiddenError,
  type BlockId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  inMemoryBlockRepo,
  inMemoryPresenceRepo,
  inMemoryUserRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createListOnlineUsers } from './list-online-users'

const me = 'u_me' as UserId
const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

const seedUser = (id: UserId, nickname: string, visibility: 'visible' | 'invisible' = 'visible') =>
  createUser({
    id,
    nickname,
    presenceVisibility: visibility,
    joinedAt: jst(2026, 5, 26, 2, 0),
  })

describe('listOnlineUsers', () => {
  it('returns visible online users', async () => {
    const userRepo = inMemoryUserRepo()
    const presenceRepo = inMemoryPresenceRepo()
    const blockRepo = inMemoryBlockRepo()
    userRepo.state.push(seedUser(alice, 'alice'))
    userRepo.state.push(seedUser(bob, 'bob'))
    presenceRepo.state.set(
      alice,
      createPresence({ userId: alice, status: 'online', lastSeenAt: jst(2026, 5, 26, 2, 0) }),
    )
    presenceRepo.state.set(
      bob,
      createPresence({ userId: bob, status: 'online', lastSeenAt: jst(2026, 5, 26, 2, 0) }),
    )

    const list = createListOnlineUsers({
      userRepository: userRepo.repo,
      presenceRepository: presenceRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ viewerId: me })
    expect(result.map((p) => p.userId).sort()).toEqual([alice, bob])
  })

  it('excludes users with presenceVisibility = invisible', async () => {
    const userRepo = inMemoryUserRepo()
    const presenceRepo = inMemoryPresenceRepo()
    const blockRepo = inMemoryBlockRepo()
    userRepo.state.push(seedUser(alice, 'alice', 'invisible'))
    userRepo.state.push(seedUser(bob, 'bob'))
    presenceRepo.state.set(
      alice,
      createPresence({ userId: alice, status: 'online', lastSeenAt: jst(2026, 5, 26, 2, 0) }),
    )
    presenceRepo.state.set(
      bob,
      createPresence({ userId: bob, status: 'online', lastSeenAt: jst(2026, 5, 26, 2, 0) }),
    )

    const list = createListOnlineUsers({
      userRepository: userRepo.repo,
      presenceRepository: presenceRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ viewerId: me })
    expect(result.map((p) => p.userId)).toEqual([bob])
  })

  it('excludes users blocked by viewer or who block viewer', async () => {
    const userRepo = inMemoryUserRepo()
    const presenceRepo = inMemoryPresenceRepo()
    const blockRepo = inMemoryBlockRepo()
    userRepo.state.push(seedUser(alice, 'alice'))
    userRepo.state.push(seedUser(bob, 'bob'))
    presenceRepo.state.set(
      alice,
      createPresence({ userId: alice, status: 'online', lastSeenAt: jst(2026, 5, 26, 2, 0) }),
    )
    presenceRepo.state.set(
      bob,
      createPresence({ userId: bob, status: 'online', lastSeenAt: jst(2026, 5, 26, 2, 0) }),
    )
    blockRepo.state.push({
      id: 'b1' as BlockId,
      blockerId: me,
      blockedId: alice,
      createdAt: jst(2026, 5, 26, 1, 0),
    })

    const list = createListOnlineUsers({
      userRepository: userRepo.repo,
      presenceRepository: presenceRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ viewerId: me })
    expect(result.map((p) => p.userId)).toEqual([bob])
  })

  it('throws ForbiddenError outside business hours', async () => {
    const userRepo = inMemoryUserRepo()
    const presenceRepo = inMemoryPresenceRepo()
    const blockRepo = inMemoryBlockRepo()

    const list = createListOnlineUsers({
      userRepository: userRepo.repo,
      presenceRepository: presenceRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: closedGuard,
    })

    await expect(list({ viewerId: me })).rejects.toThrow(ForbiddenError)
  })
})
