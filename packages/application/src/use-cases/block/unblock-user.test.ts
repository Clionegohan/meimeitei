import { describe, expect, it } from 'vitest'
import { createBlock, ForbiddenError, type BlockId, type UserId } from '@me-me-en/domain'
import {
  closedGuard,
  inMemoryBlockRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createUnblockUser } from './unblock-user'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

describe('unblockUser', () => {
  it('removes an existing block', async () => {
    const blockRepo = inMemoryBlockRepo()
    blockRepo.state.push(
      createBlock({
        id: 'b1' as BlockId,
        blockerId: alice,
        blockedId: bob,
        createdAt: jst(2026, 5, 26, 1, 0),
      }),
    )
    const unblock = createUnblockUser({
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    await unblock({ blockerId: alice, blockedId: bob })
    expect(blockRepo.state.length).toBe(0)
  })

  it('is a no-op when no block exists (idempotent)', async () => {
    const blockRepo = inMemoryBlockRepo()
    const unblock = createUnblockUser({
      blockRepository: blockRepo.repo,
      businessHoursGuard: openGuard,
    })

    await expect(unblock({ blockerId: alice, blockedId: bob })).resolves.toBeUndefined()
    expect(blockRepo.state.length).toBe(0)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const blockRepo = inMemoryBlockRepo()
    const unblock = createUnblockUser({
      blockRepository: blockRepo.repo,
      businessHoursGuard: closedGuard,
    })

    await expect(
      unblock({ blockerId: alice, blockedId: bob }),
    ).rejects.toThrow(ForbiddenError)
  })
})
