import { describe, expect, it } from 'vitest'
import { ForbiddenError, type UserId } from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryPresenceRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createUpdatePresence } from './update-presence'

const alice = 'u_alice' as UserId

describe('updatePresence', () => {
  it('persists an online presence', async () => {
    const presenceRepo = inMemoryPresenceRepo()
    const update = createUpdatePresence({
      presenceRepository: presenceRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      businessHoursGuard: openGuard,
    })

    const p = await update({ userId: alice, status: 'online' })
    expect(p.userId).toBe(alice)
    expect(p.status).toBe('online')
    expect(presenceRepo.state.get(alice)?.status).toBe('online')
  })

  it('overwrites previous presence (online -> offline)', async () => {
    const presenceRepo = inMemoryPresenceRepo()
    const update = createUpdatePresence({
      presenceRepository: presenceRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      businessHoursGuard: openGuard,
    })

    await update({ userId: alice, status: 'online' })
    const next = await update({ userId: alice, status: 'offline' })
    expect(next.status).toBe('offline')
    expect(presenceRepo.state.get(alice)?.status).toBe('offline')
  })

  it('throws ForbiddenError outside business hours', async () => {
    const presenceRepo = inMemoryPresenceRepo()
    const update = createUpdatePresence({
      presenceRepository: presenceRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      businessHoursGuard: closedGuard,
    })

    await expect(
      update({ userId: alice, status: 'online' }),
    ).rejects.toThrow(ForbiddenError)
  })
})
