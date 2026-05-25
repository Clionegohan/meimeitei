import { describe, expect, it } from 'vitest'
import { ValidationError } from '../shared/errors'
import type { BlockId, UserId } from '../shared/id'
import { createBlock, type Block } from './block'

const blockerId = 'u_alice' as UserId
const blockedId = 'u_bob' as UserId

describe('createBlock', () => {
  it('creates a one-way block record', () => {
    const b: Block = createBlock({
      id: 'b1' as BlockId,
      blockerId,
      blockedId,
      createdAt: new Date('2026-05-26T02:00:00Z'),
    })
    expect(b.id).toBe('b1')
    expect(b.blockerId).toBe('u_alice')
    expect(b.blockedId).toBe('u_bob')
    expect(b.createdAt.toISOString()).toBe('2026-05-26T02:00:00.000Z')
  })

  it('rejects self-block (blocker == blocked)', () => {
    expect(() =>
      createBlock({
        id: 'bX' as BlockId,
        blockerId,
        blockedId: blockerId,
        createdAt: new Date(),
      }),
    ).toThrow(ValidationError)
  })
})
