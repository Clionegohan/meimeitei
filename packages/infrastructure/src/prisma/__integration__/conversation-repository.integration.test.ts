import { describe, expect, it } from 'vitest'
import { Prisma } from '../../../prisma/generated/index.js'
import { createConversation } from '@me-me-en/domain'
import type { ConversationId, PostId, UserId } from '@me-me-en/domain'
import { prisma } from '../client'
import { createPrismaConversationRepository } from '../conversation-repository'

const alice = 'u_alice' as UserId
const bob = 'u_bob' as UserId
const carol = 'u_carol' as UserId

const directConv = (id: string, a: UserId, b: UserId) =>
  createConversation({
    id: id as ConversationId,
    participants: [a, b],
    rootPostId: null,
    openedAt: new Date('2026-05-25T22:00:00Z'),
  })

describe('PrismaConversationRepository (integration)', () => {
  it('save normalizes participants and round-trips', async () => {
    const repo = createPrismaConversationRepository(prisma)
    // 渡す順序は逆 (bob, alice) でも正規化されて (alice, bob) で保存される
    const conv = createConversation({
      id: 'c1' as ConversationId,
      participants: [bob, alice],
      rootPostId: null,
      openedAt: new Date('2026-05-25T22:00:00Z'),
    })
    await repo.save(conv)
    const found = await repo.findById(conv.id)
    expect(found?.participantIds).toEqual([alice, bob])
  })

  it('findByPair works for either input order', async () => {
    const repo = createPrismaConversationRepository(prisma)
    await repo.save(directConv('c1', alice, bob))
    const a = await repo.findByPair([alice, bob], null)
    const b = await repo.findByPair([bob, alice], null)
    expect(a?.id).toBe('c1')
    expect(b?.id).toBe('c1')
  })

  it('listByUser returns all conversations involving the user, desc by openedAt', async () => {
    const repo = createPrismaConversationRepository(prisma)
    await repo.save({
      ...directConv('c_ab', alice, bob),
      openedAt: new Date('2026-05-25T22:00:00Z'),
    })
    await repo.save({
      ...directConv('c_ac', alice, carol),
      openedAt: new Date('2026-05-25T23:00:00Z'),
    })
    await repo.save({
      ...directConv('c_bc', bob, carol),
      openedAt: new Date('2026-05-25T22:30:00Z'),
    })
    const aliceList = await repo.listByUser(alice)
    expect(aliceList.map((c) => c.id)).toEqual(['c_ac', 'c_ab'])
  })

  it('R2: rootPostId IS NULL のペアは partial unique index で 1 つに制限される', async () => {
    const repo = createPrismaConversationRepository(prisma)
    await repo.save(directConv('c1', alice, bob))
    // 同じペアの direct を別 id で再 save: partial unique index で違反
    await expect(repo.save(directConv('c2', alice, bob))).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    )
  })

  it('R1: rootPostId 違いの post-context conversation はペア同じでも別レコード可', async () => {
    const repo = createPrismaConversationRepository(prisma)
    await repo.save({
      ...directConv('c1', alice, bob),
      rootPostId: 'p_root1' as PostId,
    })
    await repo.save({
      ...directConv('c2', alice, bob),
      rootPostId: 'p_root2' as PostId,
    })
    const list = await repo.listByUser(alice)
    expect(list.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
  })
})
