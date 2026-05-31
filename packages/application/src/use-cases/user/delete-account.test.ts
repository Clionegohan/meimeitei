import { describe, expect, it } from 'vitest'
import { NotFoundError, createUser, type UserId } from '@me-me-en/domain'
import { createDeleteAccount } from './delete-account'
import {
  closedGuard,
  inMemoryAuthIdentityRepo,
  inMemoryUserRepo,
  openGuard,
} from '../../__test-helpers__/fakes'

const mkUser = (id: string, nickname: string) =>
  createUser({
    id: id as UserId,
    nickname,
    joinedAt: new Date('2025-08-03T13:00:00Z'),
  })

describe('deleteAccount', () => {
  it('removes the user record and all of their auth identities', async () => {
    const { repo: userRepo, state: users } = inMemoryUserRepo()
    const { repo: authRepo, state: identities } = inMemoryAuthIdentityRepo()
    users.push(mkUser('me', '己'), mkUser('keep', '残る羊'))
    identities.push(
      { provider: 'google', providerId: 'g-me', email: 'me@x.dev', userId: 'me' as UserId },
      { provider: 'google', providerId: 'g-keep', email: 'k@x.dev', userId: 'keep' as UserId },
    )

    const del = createDeleteAccount({
      userRepository: userRepo,
      authIdentityRepository: authRepo,
      businessHoursGuard: openGuard,
    })
    await del({ userId: 'me' as UserId })

    expect(await userRepo.findById('me' as UserId)).toBeNull()
    expect(await userRepo.findById('keep' as UserId)).not.toBeNull()
    expect(identities.map((i) => i.userId)).toEqual(['keep'])
  })

  it('throws NotFoundError when the user does not exist', async () => {
    const { repo: userRepo } = inMemoryUserRepo()
    const { repo: authRepo } = inMemoryAuthIdentityRepo()
    const del = createDeleteAccount({
      userRepository: userRepo,
      authIdentityRepository: authRepo,
      businessHoursGuard: openGuard,
    })
    await expect(del({ userId: 'ghost' as UserId })).rejects.toThrow(NotFoundError)
  })

  it('throws outside business hours (before touching anything)', async () => {
    const { repo: userRepo, state: users } = inMemoryUserRepo()
    const { repo: authRepo } = inMemoryAuthIdentityRepo()
    users.push(mkUser('me', '己'))
    const del = createDeleteAccount({
      userRepository: userRepo,
      authIdentityRepository: authRepo,
      businessHoursGuard: closedGuard,
    })
    await expect(del({ userId: 'me' as UserId })).rejects.toThrow()
    expect(await userRepo.findById('me' as UserId)).not.toBeNull()
  })
})
