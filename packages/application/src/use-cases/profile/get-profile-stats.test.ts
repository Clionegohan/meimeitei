import { describe, expect, it } from 'vitest'
import {
  createPost,
  type NightId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import {
  inMemoryLikeRepo,
  inMemoryLoginHistoryRepo,
  inMemoryPostRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createGetProfileStats } from './get-profile-stats'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

describe('getProfileStats', () => {
  it('returns zeros for a brand new user', async () => {
    const lh = inMemoryLoginHistoryRepo()
    const pr = inMemoryPostRepo()
    const lr = inMemoryLikeRepo()
    const get = createGetProfileStats({
      loginHistoryRepository: lh.repo,
      postRepository: pr.repo,
      likeRepository: lr.repo,
      businessHoursGuard: openGuard,
    })
    const stats = await get({ userId: alice })
    expect(stats).toEqual({
      totalLoginNights: 0,
      consecutiveLoginNights: 0,
      postCount: 0,
      candleReceivedCount: 0,
    })
  })

  it('aggregates totalLoginNights and consecutive nights', async () => {
    const lh = inMemoryLoginHistoryRepo()
    await lh.repo.recordIfFirstOfNight(alice, '2026-05-23' as NightId, new Date())
    await lh.repo.recordIfFirstOfNight(alice, '2026-05-24' as NightId, new Date())
    await lh.repo.recordIfFirstOfNight(alice, '2026-05-25' as NightId, new Date())
    // Gap night 2026-05-26 missing
    await lh.repo.recordIfFirstOfNight(alice, '2026-05-21' as NightId, new Date())

    const pr = inMemoryPostRepo()
    const lr = inMemoryLikeRepo()
    const get = createGetProfileStats({
      loginHistoryRepository: lh.repo,
      postRepository: pr.repo,
      likeRepository: lr.repo,
      businessHoursGuard: openGuard,
    })
    const stats = await get({ userId: alice })
    expect(stats.totalLoginNights).toBe(4)
    // Most recent run: 25, 24, 23 (3 consecutive). 21 breaks the chain.
    expect(stats.consecutiveLoginNights).toBe(3)
  })

  it('counts non-deleted posts only', async () => {
    const pr = inMemoryPostRepo()
    await pr.repo.save(
      createPost({
        id: 'p1' as PostId,
        authorId: alice,
        body: 'one',
        postedAt: jst(2026, 5, 26, 2, 0),
      }),
    )
    await pr.repo.save(
      createPost({
        id: 'p2' as PostId,
        authorId: alice,
        body: 'two',
        postedAt: jst(2026, 5, 26, 2, 5),
      }),
    )
    // bob's post is not counted
    await pr.repo.save(
      createPost({
        id: 'p3' as PostId,
        authorId: bob,
        body: 'theirs',
        postedAt: jst(2026, 5, 26, 2, 10),
      }),
    )

    const lh = inMemoryLoginHistoryRepo()
    const lr = inMemoryLikeRepo()
    const get = createGetProfileStats({
      loginHistoryRepository: lh.repo,
      postRepository: pr.repo,
      likeRepository: lr.repo,
      businessHoursGuard: openGuard,
    })
    const stats = await get({ userId: alice })
    expect(stats.postCount).toBe(2)
  })

  it('reports the candle count via likeRepository.countReceivedByUser', async () => {
    // Note: fake inMemoryLikeRepo.countReceivedByUser returns 0, so we stub.
    const fakeLikeRepo = {
      findById: async () => null,
      findByPostAndUser: async () => null,
      save: async () => {},
      delete: async () => {},
      countByPost: async () => 0,
      countReceivedByUser: async (userId: UserId) => (userId === alice ? 7 : 0),
    }
    const lh = inMemoryLoginHistoryRepo()
    const pr = inMemoryPostRepo()
    const get = createGetProfileStats({
      loginHistoryRepository: lh.repo,
      postRepository: pr.repo,
      likeRepository: fakeLikeRepo,
      businessHoursGuard: openGuard,
    })
    const stats = await get({ userId: alice })
    expect(stats.candleReceivedCount).toBe(7)
  })
})
