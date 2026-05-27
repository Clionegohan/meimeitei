import { describe, expect, it } from 'vitest'
import { ForbiddenError, createUser, type UserId } from '@me-me-en/domain'
import {
  closedGuard,
  inMemoryBlockRepo,
  inMemoryUserRepo,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createListUsers } from './list-users'

const uid = (s: string): UserId => s as UserId
const seedUser = (repo: ReturnType<typeof inMemoryUserRepo>, id: string): void => {
  repo.state.push(
    createUser({ id: uid(id), nickname: id, joinedAt: new Date('2026-05-01') }),
  )
}

describe('listUsers (客帳)', () => {
  it('returns every user when there are no blocks', async () => {
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    ;['alice', 'bob', 'carol'].forEach((id) => seedUser(userRepo, id))
    const listUsers = createListUsers({
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await listUsers({ viewerId: uid('alice') })
    expect(result.map((u) => u.id)).toEqual(['alice', 'bob', 'carol'])
  })

  it('excludes users in a block relationship with the viewer (either direction)', async () => {
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    ;['alice', 'bob', 'carol'].forEach((id) => seedUser(userRepo, id))
    // alice ↔ bob を block (existsBetween は無向)
    blockRepo.state.push({
      id: 'b1' as never,
      blockerId: uid('alice'),
      blockedId: uid('bob'),
      createdAt: new Date(),
    })
    const listUsers = createListUsers({
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await listUsers({ viewerId: uid('alice') })
    expect(result.map((u) => u.id)).toEqual(['alice', 'carol'])
  })

  it('always includes the viewer themselves', async () => {
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    seedUser(userRepo, 'alice')
    const listUsers = createListUsers({
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await listUsers({ viewerId: uid('alice') })
    expect(result.map((u) => u.id)).toEqual(['alice'])
  })

  it('throws ForbiddenError outside business hours', async () => {
    const userRepo = inMemoryUserRepo()
    const blockRepo = inMemoryBlockRepo()
    seedUser(userRepo, 'alice')
    const listUsers = createListUsers({
      userRepository: userRepo.repo,
      blockRepository: blockRepo.repo,
      businessHoursGuard: closedGuard,
    })

    await expect(listUsers({ viewerId: uid('alice') })).rejects.toThrow(ForbiddenError)
  })
})
