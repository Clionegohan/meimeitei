import { describe, expect, it } from 'vitest'
import { ValidationError } from '../shared/errors'
import type { ConversationId, PostId, UserId } from '../shared/id'
import {
  createConversation,
  normalizeParticipants,
  type Conversation,
} from './conversation'

const userA = 'u_alpha' as UserId
const userB = 'u_beta' as UserId
const postX = 'p_x' as PostId
const convId = 'c1' as ConversationId
const openedAt = new Date('2026-05-25T14:00:00Z')

describe('createConversation', () => {
  it('creates an R2 conversation (rootPostId = null)', () => {
    const c: Conversation = createConversation({
      id: convId,
      participants: [userA, userB],
      rootPostId: null,
      openedAt,
    })
    expect(c.id).toBe('c1')
    expect(c.participantIds).toEqual(['u_alpha', 'u_beta'])
    expect(c.rootPostId).toBeNull()
    expect(c.openedAt.toISOString()).toBe('2026-05-25T14:00:00.000Z')
  })

  it('creates an R1 conversation with a rootPostId', () => {
    const c = createConversation({
      id: 'c2' as ConversationId,
      participants: [userA, userB],
      rootPostId: postX,
      openedAt,
    })
    expect(c.rootPostId).toBe('p_x')
  })

  it('normalizes participants (lexical order, regardless of input order)', () => {
    const c = createConversation({
      id: 'c3' as ConversationId,
      participants: [userB, userA], // input reversed
      rootPostId: null,
      openedAt,
    })
    expect(c.participantIds).toEqual(['u_alpha', 'u_beta'])
  })

  it('rejects same participant on both sides (no self-conversation)', () => {
    expect(() =>
      createConversation({
        id: 'cX' as ConversationId,
        participants: [userA, userA],
        rootPostId: null,
        openedAt,
      }),
    ).toThrow(ValidationError)
  })

  it('produces a frozen/normalized participantIds tuple', () => {
    const c = createConversation({
      id: 'c4' as ConversationId,
      participants: [userB, userA],
      rootPostId: null,
      openedAt,
    })
    // participantIds is always [smaller, larger]
    expect(c.participantIds[0] < c.participantIds[1]).toBe(true)
  })
})

describe('normalizeParticipants', () => {
  it('returns lexically sorted pair', () => {
    expect(normalizeParticipants(userB, userA)).toEqual(['u_alpha', 'u_beta'])
    expect(normalizeParticipants(userA, userB)).toEqual(['u_alpha', 'u_beta'])
  })

  it('throws on self-pair', () => {
    expect(() => normalizeParticipants(userA, userA)).toThrow(ValidationError)
  })
})
