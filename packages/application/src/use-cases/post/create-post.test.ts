import { describe, expect, it } from 'vitest'
import { ForbiddenError, ValidationError, type UserId } from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryPostRepo,
  jst,
  openGuard,
  sequentialIdGen,
} from '../../__test-helpers__/fakes'
import { createCreatePost } from './create-post'

const alice = 'u_alice' as UserId

describe('createPost', () => {
  it('persists a post and derives nightId from clock', async () => {
    const postRepo = inMemoryPostRepo()
    const create = createCreatePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)), // belongs to 2026-05-25 night
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const p = await create({ authorId: alice, body: '眠れない夜。' })

    expect(p.authorId).toBe(alice)
    expect(p.body).toBe('眠れない夜。')
    expect(p.nightId).toBe('2026-05-25')
    expect(p.deletedAt).toBeNull()
    expect(postRepo.state.length).toBe(1)
  })

  it('throws ForbiddenError outside business hours via guard', async () => {
    const postRepo = inMemoryPostRepo()
    const create = createCreatePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: closedGuard,
    })

    await expect(create({ authorId: alice, body: 'x' })).rejects.toThrow(ForbiddenError)
  })

  it('propagates createPost factory validation (empty body)', async () => {
    const postRepo = inMemoryPostRepo()
    const create = createCreatePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(create({ authorId: alice, body: '' })).rejects.toThrow(ValidationError)
  })

  it('propagates body length validation (> 280 graphemes)', async () => {
    const postRepo = inMemoryPostRepo()
    const create = createCreatePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const long = 'あ'.repeat(281)
    await expect(create({ authorId: alice, body: long })).rejects.toThrow(ValidationError)
  })
})
