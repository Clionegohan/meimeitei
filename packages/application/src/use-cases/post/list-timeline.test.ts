import { describe, expect, it } from 'vitest'
import {
  createPost,
  ForbiddenError,
  markPostAsDeleted,
  type BlockId,
  type NightId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryBlockRepo,
  inMemoryPostRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createListTimeline } from './list-timeline'

const me = 'u_me' as UserId
const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId

const seedPost = (id: string, author: UserId, postedAt: Date) =>
  createPost({ id: id as PostId, authorId: author, body: `body ${id}`, postedAt })

describe('listTimeline', () => {
  it("returns the current night's posts ordered newest-first", async () => {
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', alice, jst(2026, 5, 26, 2, 10)))
    postRepo.state.push(seedPost('p2', bob, jst(2026, 5, 26, 2, 30)))

    const list = createListTimeline({
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })

    const result = await list({ viewerId: me })
    expect(result.map((p) => p.id)).toEqual(['p2', 'p1'])
  })

  it('excludes posts by authors blocked by viewer or who blocked viewer', async () => {
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', alice, jst(2026, 5, 26, 2, 10)))
    postRepo.state.push(seedPost('p2', bob, jst(2026, 5, 26, 2, 30)))
    blockRepo.state.push({
      id: 'b1' as BlockId,
      blockerId: me,
      blockedId: alice,
      createdAt: jst(2026, 5, 26, 1, 0),
    })

    const list = createListTimeline({
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })

    const result = await list({ viewerId: me })
    expect(result.map((p) => p.id)).toEqual(['p2'])
  })

  it('excludes deleted posts', async () => {
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()
    const p1 = seedPost('p1', alice, jst(2026, 5, 26, 2, 10))
    postRepo.state.push(markPostAsDeleted(p1, jst(2026, 5, 26, 2, 20)))
    postRepo.state.push(seedPost('p2', bob, jst(2026, 5, 26, 2, 30)))

    const list = createListTimeline({
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })

    const result = await list({ viewerId: me })
    expect(result.map((p) => p.id)).toEqual(['p2'])
  })

  it('accepts an explicit nightId override', async () => {
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', alice, jst(2026, 5, 26, 2, 10)))
    postRepo.state.push(seedPost('p2', bob, jst(2026, 5, 25, 2, 30))) // previous night

    const list = createListTimeline({
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 3, 0)),
      businessHoursGuard: openGuard,
    })

    const result = await list({ viewerId: me, nightId: '2026-05-24' as NightId })
    expect(result.map((p) => p.id)).toEqual(['p2'])
  })

  it('throws ForbiddenError outside business hours', async () => {
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()

    const list = createListTimeline({
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      businessHoursGuard: closedGuard,
    })

    await expect(list({ viewerId: me })).rejects.toThrow(ForbiddenError)
  })
})
