import { describe, expect, it } from 'vitest'
import {
  createPost,
  ForbiddenError,
  markPostAsDeleted,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  inMemoryPostRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createListOwnPosts } from './list-own-posts'

const me = 'u_me' as UserId
const other = 'u_other' as UserId

const seedPost = (id: string, author: UserId, postedAt: Date) =>
  createPost({ id: id as PostId, authorId: author, body: `body ${id}`, postedAt })

describe('listOwnPosts', () => {
  it('returns only the requester own posts, newest-first', async () => {
    const postRepo = inMemoryPostRepo()
    postRepo.state.push(seedPost('p1', me, jst(2026, 5, 25, 22, 30)))
    postRepo.state.push(seedPost('p2', me, jst(2026, 5, 26, 2, 30)))
    postRepo.state.push(seedPost('p3', other, jst(2026, 5, 26, 2, 0)))

    const list = createListOwnPosts({
      postRepository: postRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ authorId: me })
    expect(result.map((p) => p.id)).toEqual(['p2', 'p1'])
  })

  it('excludes deleted posts', async () => {
    const postRepo = inMemoryPostRepo()
    const p1 = seedPost('p1', me, jst(2026, 5, 25, 22, 30))
    postRepo.state.push(markPostAsDeleted(p1, jst(2026, 5, 26, 0, 0)))
    postRepo.state.push(seedPost('p2', me, jst(2026, 5, 26, 2, 30)))

    const list = createListOwnPosts({
      postRepository: postRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ authorId: me })
    expect(result.map((p) => p.id)).toEqual(['p2'])
  })

  it('returns empty array when user has no posts', async () => {
    const postRepo = inMemoryPostRepo()
    const list = createListOwnPosts({
      postRepository: postRepo.repo,
      businessHoursGuard: openGuard,
    })

    const result = await list({ authorId: me })
    expect(result).toEqual([])
  })

  it('throws ForbiddenError outside business hours', async () => {
    const postRepo = inMemoryPostRepo()
    const list = createListOwnPosts({
      postRepository: postRepo.repo,
      businessHoursGuard: closedGuard,
    })

    await expect(list({ authorId: me })).rejects.toThrow(ForbiddenError)
  })
})
