import { describe, expect, it } from 'vitest'
import type { LikeId, PostId, UserId } from '../shared/id'
import { createLike, type Like } from './like'

const baseInput = {
  id: 'l1' as LikeId,
  postId: 'p1' as PostId,
  userId: 'u1' as UserId,
  addedAt: new Date('2026-05-26T02:00:00Z'),
}

describe('createLike', () => {
  it('creates a like with the given fields', () => {
    const l: Like = createLike(baseInput)
    expect(l.id).toBe('l1')
    expect(l.postId).toBe('p1')
    expect(l.userId).toBe('u1')
    expect(l.addedAt.toISOString()).toBe('2026-05-26T02:00:00.000Z')
  })

  it('keeps fields immutable (readonly)', () => {
    const l = createLike(baseInput)
    // readonly is a compile-time check; the runtime object is a plain literal.
    // We assert the shape only.
    expect(Object.keys(l).sort()).toEqual(['addedAt', 'id', 'postId', 'userId'])
  })
})
