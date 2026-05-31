import { describe, expect, it } from 'vitest'
import {
  createUser,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  type UserId,
} from '@me-me-en/domain'
import { closedGuard, inMemoryUserRepo, jst, openGuard } from '../../__test-helpers__/fakes'
import { createUpdateProfile } from './update-profile'

const seedUser = (id: string, nickname: string) =>
  createUser({
    id: id as UserId,
    nickname,
    joinedAt: jst(2026, 5, 26, 2, 0),
  })

describe('updateProfile', () => {
  it('updates bio', async () => {
    const { repo, state } = inMemoryUserRepo()
    state.push(seedUser('u1', '月見羊'))
    const update = createUpdateProfile({ userRepository: repo, businessHoursGuard: openGuard })

    const u = await update({
      userId: 'u1' as UserId,
      patch: { bio: '夜更けの羊。月とほうじ茶。' },
    })

    expect(u.bio).toBe('夜更けの羊。月とほうじ茶。')
    expect(u.nickname).toBe('月見羊') // unchanged
    expect(state[0]?.bio).toBe('夜更けの羊。月とほうじ茶。')
  })

  it('updates tone and presenceVisibility together', async () => {
    const { repo } = inMemoryUserRepo()
    repo.save(seedUser('u1', '月見羊'))
    const update = createUpdateProfile({ userRepository: repo, businessHoursGuard: openGuard })

    const u = await update({
      userId: 'u1' as UserId,
      patch: { tone: '#50B7F0', presenceVisibility: 'invisible' },
    })

    expect(u.tone).toBe('#50B7F0')
    expect(u.presenceVisibility).toBe('invisible')
  })

  it('throws NotFoundError when user does not exist', async () => {
    const { repo } = inMemoryUserRepo()
    const update = createUpdateProfile({ userRepository: repo, businessHoursGuard: openGuard })

    await expect(update({ userId: 'ghost' as UserId, patch: { bio: 'x' } })).rejects.toThrow(
      NotFoundError,
    )
  })

  it('throws ForbiddenError outside business hours', async () => {
    const { repo, state } = inMemoryUserRepo()
    state.push(seedUser('u1', '月見羊'))
    const update = createUpdateProfile({ userRepository: repo, businessHoursGuard: closedGuard })

    await expect(update({ userId: 'u1' as UserId, patch: { bio: 'x' } })).rejects.toThrow(
      ForbiddenError,
    )
  })

  it('allows keeping the same nickname (no false unique conflict against self)', async () => {
    const { repo, state } = inMemoryUserRepo()
    state.push(seedUser('u1', '月見羊'))
    const update = createUpdateProfile({ userRepository: repo, businessHoursGuard: openGuard })

    const u = await update({
      userId: 'u1' as UserId,
      patch: { nickname: '月見羊', bio: 'hello' },
    })

    expect(u.nickname).toBe('月見羊')
    expect(u.bio).toBe('hello')
  })

  it('rejects nickname already taken by another user', async () => {
    const { repo, state } = inMemoryUserRepo()
    state.push(seedUser('u1', '月見羊'))
    state.push(seedUser('u2', '茶の羊'))
    const update = createUpdateProfile({ userRepository: repo, businessHoursGuard: openGuard })

    await expect(update({ userId: 'u1' as UserId, patch: { nickname: '茶の羊' } })).rejects.toThrow(
      ValidationError,
    )
  })

  it('propagates createUser validation on patch (bio too long)', async () => {
    const { repo, state } = inMemoryUserRepo()
    state.push(seedUser('u1', '月見羊'))
    const update = createUpdateProfile({ userRepository: repo, businessHoursGuard: openGuard })

    const long = 'あ'.repeat(201)
    await expect(update({ userId: 'u1' as UserId, patch: { bio: long } })).rejects.toThrow(
      ValidationError,
    )
  })
})
