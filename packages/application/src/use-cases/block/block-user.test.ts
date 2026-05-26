import { describe, expect, it } from 'vitest'
import { ForbiddenError, ValidationError, type UserId } from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryBlockRepo,
  jst,
  openGuard,
  sequentialIdGen,
} from '../../__test-helpers__/fakes'
import { createBlockUser } from './block-user'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

describe('blockUser', () => {
  it('creates a new block record', async () => {
    const blockRepo = inMemoryBlockRepo()
    const block = createBlockUser({
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const result = await block({ blockerId: alice, blockedId: bob })
    expect(result.blockerId).toBe(alice)
    expect(result.blockedId).toBe(bob)
    expect(blockRepo.state.length).toBe(1)
  })

  it('is idempotent — returns the existing block', async () => {
    const blockRepo = inMemoryBlockRepo()
    const block = createBlockUser({
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const first = await block({ blockerId: alice, blockedId: bob })
    const second = await block({ blockerId: alice, blockedId: bob })
    expect(second.id).toBe(first.id)
    expect(blockRepo.state.length).toBe(1)
  })

  it('throws ValidationError when blocker == blocked (self-block)', async () => {
    const blockRepo = inMemoryBlockRepo()
    const block = createBlockUser({
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      block({ blockerId: alice, blockedId: alice }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const blockRepo = inMemoryBlockRepo()
    const block = createBlockUser({
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: closedGuard,
    })

    await expect(
      block({ blockerId: alice, blockedId: bob }),
    ).rejects.toThrow(ForbiddenError)
  })
})
