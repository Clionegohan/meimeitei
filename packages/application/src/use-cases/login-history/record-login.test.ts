import { describe, expect, it } from 'vitest'
import { ForbiddenError, type NightId, type UserId } from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryLoginHistoryRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createRecordLogin } from './record-login'

const alice = 'u_alice' as UserId

describe('recordLogin', () => {
  it('records the current night for the user', async () => {
    const { repo, state } = inMemoryLoginHistoryRepo()
    const record = createRecordLogin({
      loginHistoryRepository: repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      businessHoursGuard: openGuard,
    })
    await record({ userId: alice })
    expect(state.get(alice)?.has('2026-05-25' as NightId)).toBe(true)
  })

  it('is idempotent over the same night', async () => {
    const { repo, state } = inMemoryLoginHistoryRepo()
    const record = createRecordLogin({
      loginHistoryRepository: repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      businessHoursGuard: openGuard,
    })
    await record({ userId: alice })
    await record({ userId: alice })
    expect(state.get(alice)?.size).toBe(1)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const { repo } = inMemoryLoginHistoryRepo()
    const record = createRecordLogin({
      loginHistoryRepository: repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      businessHoursGuard: closedGuard,
    })
    await expect(record({ userId: alice })).rejects.toThrow(ForbiddenError)
  })
})
