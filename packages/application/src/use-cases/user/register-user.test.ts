import { describe, expect, it } from 'vitest'
import { ForbiddenError, ValidationError } from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryUserRepo,
  jst,
  openGuard,
  sequentialIdGen,
} from '../../__test-helpers__/fakes'
import { createRegisterUser } from './register-user'

describe('registerUser', () => {
  it('creates a user with the given nickname and defaults', async () => {
    const { repo, state } = inMemoryUserRepo()
    const register = createRegisterUser({
      userRepository: repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const u = await register({ nickname: '月見羊' })

    expect(u.nickname).toBe('月見羊')
    expect(u.id).toBe('id-1')
    expect(u.bio).toBe('')
    expect(u.tone).toBe('#E8E2D2')
    expect(u.presenceVisibility).toBe('visible')
    expect(u.currentSigns).toEqual([])
    expect(u.joinedAt.toISOString()).toBe('2026-05-25T17:00:00.000Z')
    expect(state.length).toBe(1)
    expect(state[0]?.id).toBe('id-1')
  })

  it('throws ForbiddenError outside business hours', async () => {
    const { repo } = inMemoryUserRepo()
    const register = createRegisterUser({
      userRepository: repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: closedGuard,
    })

    await expect(register({ nickname: '月見羊' })).rejects.toThrow(ForbiddenError)
  })

  it('rejects duplicate nickname', async () => {
    const { repo } = inMemoryUserRepo()
    const register = createRegisterUser({
      userRepository: repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await register({ nickname: '月見羊' })
    await expect(register({ nickname: '月見羊' })).rejects.toThrow(ValidationError)
  })

  it('propagates createUser validation (empty nickname)', async () => {
    const { repo } = inMemoryUserRepo()
    const register = createRegisterUser({
      userRepository: repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(register({ nickname: '' })).rejects.toThrow(ValidationError)
    await expect(register({ nickname: '   ' })).rejects.toThrow(ValidationError)
  })

  it('propagates createUser validation (nickname > 20 graphemes)', async () => {
    const { repo } = inMemoryUserRepo()
    const register = createRegisterUser({
      userRepository: repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const long = 'あ'.repeat(21)
    await expect(register({ nickname: long })).rejects.toThrow(ValidationError)
  })
})
