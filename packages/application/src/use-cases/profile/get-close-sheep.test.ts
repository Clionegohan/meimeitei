import { describe, expect, it } from 'vitest'
import {
  createBlock,
  createConversation,
  createMessage,
  type BlockId,
  type ConversationId,
  type MessageId,
  type PostId,
  type UserId,
} from '@me-me-en/domain'
import {
  fixedClock,
  inMemoryBlockRepo,
  inMemoryConversationRepo,
  inMemoryMessageRepo,
  jst,
  openGuard,
} from '../../__test-helpers__/fakes'
import { createGetCloseSheep } from './get-close-sheep'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId
const carol = 'u_carol' as UserId
const dave = 'u_dave' as UserId
const eve = 'u_eve' as UserId

const now = jst(2026, 5, 26, 2, 0)

const newConv = (id: string, a: UserId, b: UserId): ReturnType<typeof createConversation> =>
  createConversation({
    id: id as ConversationId,
    participants: [a, b],
    rootPostId: null,
    openedAt: jst(2026, 4, 1, 0, 0),
  })

const newMessage = (
  id: string,
  conversationId: ConversationId,
  senderId: UserId,
  sentAt: Date,
): ReturnType<typeof createMessage> =>
  createMessage({
    id: id as MessageId,
    conversationId,
    senderId,
    body: 'hi',
    sentAt,
  })

describe('getCloseSheep', () => {
  it('returns empty when the user has no conversations', async () => {
    const cr = inMemoryConversationRepo()
    const mr = inMemoryMessageRepo()
    const br = inMemoryBlockRepo()
    const get = createGetCloseSheep({
      conversationRepository: cr.repo,
      messageRepository: mr.repo,
      blockRepository: br.repo,
      clock: fixedClock(now),
      businessHoursGuard: openGuard,
    })
    expect(await get({ userId: alice })).toEqual([])
  })

  it('aggregates per peer, sorts descending, caps at 3', async () => {
    const cr = inMemoryConversationRepo()
    const mr = inMemoryMessageRepo()
    const br = inMemoryBlockRepo()

    const ab = newConv('c_ab', alice, bob)
    const ac = newConv('c_ac', alice, carol)
    const ad = newConv('c_ad', alice, dave)
    const ae = newConv('c_ae', alice, eve)
    await cr.repo.save(ab)
    await cr.repo.save(ac)
    await cr.repo.save(ad)
    await cr.repo.save(ae)

    // bob: 5
    for (let i = 0; i < 5; i++) {
      await mr.repo.save(newMessage(`m_ab_${i}`, ab.id, alice, jst(2026, 5, 24, 1, i)))
    }
    // carol: 3
    for (let i = 0; i < 3; i++) {
      await mr.repo.save(newMessage(`m_ac_${i}`, ac.id, carol, jst(2026, 5, 24, 1, i)))
    }
    // dave: 2
    for (let i = 0; i < 2; i++) {
      await mr.repo.save(newMessage(`m_ad_${i}`, ad.id, dave, jst(2026, 5, 24, 1, i)))
    }
    // eve: 1
    await mr.repo.save(newMessage(`m_ae_0`, ae.id, eve, jst(2026, 5, 24, 1, 0)))

    const get = createGetCloseSheep({
      conversationRepository: cr.repo,
      messageRepository: mr.repo,
      blockRepository: br.repo,
      clock: fixedClock(now),
      businessHoursGuard: openGuard,
    })
    const result = await get({ userId: alice })
    expect(result).toEqual([
      { userId: bob, messageCount: 5 },
      { userId: carol, messageCount: 3 },
      { userId: dave, messageCount: 2 },
    ])
  })

  it('sums across multiple conversations with the same peer', async () => {
    const cr = inMemoryConversationRepo()
    const mr = inMemoryMessageRepo()
    const br = inMemoryBlockRepo()

    // alice ↔ bob: 2 conversations (one is direct, one is from post-context)
    const direct = newConv('c_ab_direct', alice, bob)
    const fromPost = createConversation({
      id: 'c_ab_post' as ConversationId,
      participants: [alice, bob],
      rootPostId: 'p_root' as PostId,
      openedAt: jst(2026, 4, 1, 0, 0),
    })
    await cr.repo.save(direct)
    await cr.repo.save(fromPost)

    await mr.repo.save(newMessage('m1', direct.id, bob, jst(2026, 5, 24, 1, 0)))
    await mr.repo.save(newMessage('m2', direct.id, bob, jst(2026, 5, 24, 1, 1)))
    await mr.repo.save(newMessage('m3', fromPost.id, alice, jst(2026, 5, 24, 1, 2)))

    const get = createGetCloseSheep({
      conversationRepository: cr.repo,
      messageRepository: mr.repo,
      blockRepository: br.repo,
      clock: fixedClock(now),
      businessHoursGuard: openGuard,
    })
    const result = await get({ userId: alice })
    expect(result).toEqual([{ userId: bob, messageCount: 3 }])
  })

  it('excludes blocked peers (either direction)', async () => {
    const cr = inMemoryConversationRepo()
    const mr = inMemoryMessageRepo()
    const br = inMemoryBlockRepo()

    const ab = newConv('c_ab', alice, bob)
    const ac = newConv('c_ac', alice, carol)
    await cr.repo.save(ab)
    await cr.repo.save(ac)
    await mr.repo.save(newMessage('m1', ab.id, bob, jst(2026, 5, 24, 1, 0)))
    await mr.repo.save(newMessage('m2', ab.id, bob, jst(2026, 5, 24, 1, 1)))
    await mr.repo.save(newMessage('m3', ac.id, carol, jst(2026, 5, 24, 1, 0)))

    // alice blocked bob
    await br.repo.save(
      createBlock({
        id: 'b1' as BlockId,
        blockerId: alice,
        blockedId: bob,
        createdAt: jst(2026, 5, 1, 0, 0),
      }),
    )

    const get = createGetCloseSheep({
      conversationRepository: cr.repo,
      messageRepository: mr.repo,
      blockRepository: br.repo,
      clock: fixedClock(now),
      businessHoursGuard: openGuard,
    })
    const result = await get({ userId: alice })
    expect(result).toEqual([{ userId: carol, messageCount: 1 }])
  })

  it('only counts messages within the 30-day window', async () => {
    const cr = inMemoryConversationRepo()
    const mr = inMemoryMessageRepo()
    const br = inMemoryBlockRepo()

    const ab = newConv('c_ab', alice, bob)
    await cr.repo.save(ab)
    // inside the 30d window
    await mr.repo.save(newMessage('m_in', ab.id, bob, jst(2026, 5, 24, 1, 0)))
    // way before the window — 60d back
    await mr.repo.save(newMessage('m_old', ab.id, bob, jst(2026, 3, 1, 1, 0)))

    const get = createGetCloseSheep({
      conversationRepository: cr.repo,
      messageRepository: mr.repo,
      blockRepository: br.repo,
      clock: fixedClock(now),
      businessHoursGuard: openGuard,
    })
    const result = await get({ userId: alice })
    expect(result).toEqual([{ userId: bob, messageCount: 1 }])
  })

  it('omits peers whose message count is 0', async () => {
    const cr = inMemoryConversationRepo()
    const mr = inMemoryMessageRepo()
    const br = inMemoryBlockRepo()

    const ab = newConv('c_ab', alice, bob)
    const ac = newConv('c_ac', alice, carol)
    await cr.repo.save(ab)
    await cr.repo.save(ac)
    // only carol has a recent message; bob has nothing inside the window
    await mr.repo.save(newMessage('m1', ac.id, carol, jst(2026, 5, 24, 1, 0)))

    const get = createGetCloseSheep({
      conversationRepository: cr.repo,
      messageRepository: mr.repo,
      blockRepository: br.repo,
      clock: fixedClock(now),
      businessHoursGuard: openGuard,
    })
    const result = await get({ userId: alice })
    expect(result).toEqual([{ userId: carol, messageCount: 1 }])
  })
})
