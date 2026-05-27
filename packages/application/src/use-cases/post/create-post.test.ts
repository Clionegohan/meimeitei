import { describe, expect, it } from 'vitest'
import {
  ForbiddenError,
  RateLimitError,
  ValidationError,
  createPost as createPostEntity,
  markPostAsDeleted,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
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

  // ── rate limit (spec C: 30 秒に 1 投稿) ──────────────────────────────
  const seedPost = (
    repo: ReturnType<typeof inMemoryPostRepo>,
    id: string,
    postedAt: Date,
  ): void => {
    repo.state.push(
      createPostEntity({
        id: id as PostId,
        authorId: alice,
        body: '前の文。',
        postedAt,
      }),
    )
  }

  it('throws RateLimitError when the author posted within the last 30s', async () => {
    const postRepo = inMemoryPostRepo()
    // 直近の投稿: now の 10 秒前 (< 30s)
    seedPost(postRepo, 'p-prev', jst(2026, 5, 26, 1, 59, 50))
    const create = createCreatePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(create({ authorId: alice, body: '連投。' })).rejects.toThrow(
      RateLimitError,
    )
    // 投稿は保存されない (seed の 1 件のみ)
    expect(postRepo.state.length).toBe(1)
  })

  it('allows posting once 30s have elapsed since the last post', async () => {
    const postRepo = inMemoryPostRepo()
    // 直近の投稿: now の 31 秒前 (>= 30s)
    seedPost(postRepo, 'p-prev', jst(2026, 5, 26, 1, 59, 29))
    const create = createCreatePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const p = await create({ authorId: alice, body: 'やっと置けた。' })
    expect(p.body).toBe('やっと置けた。')
    expect(postRepo.state.length).toBe(2)
  })

  it('counts deleted posts too (no delete-to-bypass)', async () => {
    const postRepo = inMemoryPostRepo()
    // 10 秒前に投稿し、即削除しても rate limit は効く
    const deleted = markPostAsDeleted(
      createPostEntity({
        id: 'p-deleted' as PostId,
        authorId: alice,
        body: '消した文。',
        postedAt: jst(2026, 5, 26, 1, 59, 50),
      }),
      jst(2026, 5, 26, 1, 59, 55),
    )
    postRepo.state.push(deleted)
    const create = createCreatePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(create({ authorId: alice, body: '連投。' })).rejects.toThrow(
      RateLimitError,
    )
  })

  it('rate limit is per-author (another user is unaffected)', async () => {
    const postRepo = inMemoryPostRepo()
    seedPost(postRepo, 'p-alice', jst(2026, 5, 26, 1, 59, 50))
    const create = createCreatePost({
      postRepository: postRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 0, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const bob = 'u_bob' as UserId
    const p = await create({ authorId: bob, body: 'bob の初投稿。' })
    expect(p.authorId).toBe(bob)
  })
})
