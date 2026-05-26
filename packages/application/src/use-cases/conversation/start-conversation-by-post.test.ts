import { describe, expect, it } from 'vitest'
import {
  createPost,
  ForbiddenError,
  NotFoundError,
  type BlockId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import {
  closedGuard,
  fixedClock,
  inMemoryBlockRepo,
  inMemoryConversationRepo,
  inMemoryPostRepo,
  jst,
  openGuard,
  sequentialIdGen,
} from '../../__test-helpers__/fakes'
import { createStartConversationByPost } from './start-conversation-by-post'

const initiator = 'u_alice' as UserId
const author = 'u_bob' as UserId

const seedPost = (id: string, authorId: UserId) =>
  createPost({
    id: id as PostId,
    authorId,
    body: '眠れない夜。',
    postedAt: jst(2026, 5, 26, 2, 0),
  })

describe('startConversationByPost (R1)', () => {
  it('creates a new R1 conversation linking initiator and post author', async () => {
    const convRepo = inMemoryConversationRepo()
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', author))

    const start = createStartConversationByPost({
      conversationRepository: convRepo.repo,
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const conv = await start({ initiatorId: initiator, postId: 'p1' as PostId })

    expect(conv.rootPostId).toBe('p1')
    expect(conv.participantIds).toEqual([initiator, author].sort())
    expect(convRepo.state.length).toBe(1)
  })

  it('reuses an existing R1 conversation for the same post', async () => {
    const convRepo = inMemoryConversationRepo()
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', author))

    const start = createStartConversationByPost({
      conversationRepository: convRepo.repo,
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    const first = await start({ initiatorId: initiator, postId: 'p1' as PostId })
    const second = await start({ initiatorId: initiator, postId: 'p1' as PostId })

    expect(second.id).toBe(first.id)
    expect(convRepo.state.length).toBe(1)
  })

  it('throws NotFoundError when the post does not exist', async () => {
    const convRepo = inMemoryConversationRepo()
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()

    const start = createStartConversationByPost({
      conversationRepository: convRepo.repo,
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      start({ initiatorId: initiator, postId: 'ghost' as PostId }),
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when there is a block in either direction', async () => {
    const convRepo = inMemoryConversationRepo()
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', author))
    blockRepo.state.push({
      id: 'b1' as BlockId,
      blockerId: author,
      blockedId: initiator,
      createdAt: jst(2026, 5, 26, 1, 0),
    })

    const start = createStartConversationByPost({
      conversationRepository: convRepo.repo,
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 26, 2, 5)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: openGuard,
    })

    await expect(
      start({ initiatorId: initiator, postId: 'p1' as PostId }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError outside business hours', async () => {
    const convRepo = inMemoryConversationRepo()
    const postRepo = inMemoryPostRepo()
    const blockRepo = inMemoryBlockRepo()
    postRepo.state.push(seedPost('p1', author))

    const start = createStartConversationByPost({
      conversationRepository: convRepo.repo,
      postRepository: postRepo.repo,
      blockRepository: blockRepo.repo,
      clock: fixedClock(jst(2026, 5, 25, 12, 0)),
      idGenerator: sequentialIdGen(),
      businessHoursGuard: closedGuard,
    })

    await expect(
      start({ initiatorId: initiator, postId: 'p1' as PostId }),
    ).rejects.toThrow(ForbiddenError)
  })
})
