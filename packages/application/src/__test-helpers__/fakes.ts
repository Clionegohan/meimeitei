// Shared test helpers for use case tests. Not exported from the package.

import { ForbiddenError } from '@me-me-en/domain'
import type {
  BlockId,
  ConversationId,
  LikeId,
  MessageId,
  PostId,
  User,
  UserId,
  UserRepository,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../ports/business-hours-guard'
import type { Clock } from '../ports/clock'
import type { IdGenerator } from '../ports/id-generator'

// Build a Date representing the given JST wall clock (no DST).
export const jst = (
  y: number,
  m: number,
  d: number,
  h: number,
  min = 0,
  s = 0,
): Date => new Date(Date.UTC(y, m - 1, d, h - 9, min, s))

export const fixedClock = (date: Date): Clock => ({ now: () => date })

export const openGuard: BusinessHoursGuard = { ensureOpen: () => {} }

export const closedGuard: BusinessHoursGuard = {
  ensureOpen: () => {
    throw new ForbiddenError('test: outside hours')
  },
}

// Sequential id generator — predictable across calls; same counter shared
// across entity types (the brand keeps them type-distinct in the type system).
export const sequentialIdGen = (): IdGenerator => {
  let n = 0
  const next = (): string => `id-${++n}`
  return {
    user: () => next() as UserId,
    conversation: () => next() as ConversationId,
    message: () => next() as MessageId,
    post: () => next() as PostId,
    like: () => next() as LikeId,
    block: () => next() as BlockId,
  }
}

// In-memory UserRepository — minimal, just enough for use case tests.
export const inMemoryUserRepo = (): {
  repo: UserRepository
  state: User[]
} => {
  const state: User[] = []
  const repo: UserRepository = {
    findById: async (id) => state.find((u) => u.id === id) ?? null,
    findByNickname: async (n) => state.find((u) => u.nickname === n) ?? null,
    save: async (user) => {
      const idx = state.findIndex((u) => u.id === user.id)
      if (idx >= 0) state[idx] = user
      else state.push(user)
    },
    list: async () => state,
  }
  return { repo, state }
}

// In-memory ConversationRepository.
export const inMemoryConversationRepo = (): {
  repo: import('@me-me-en/domain').ConversationRepository
  state: import('@me-me-en/domain').Conversation[]
} => {
  type Conv = import('@me-me-en/domain').Conversation
  const state: Conv[] = []
  const sameRoot = (a: import('@me-me-en/domain').PostId | null, b: Conv['rootPostId']) =>
    (a === null && b === null) || (a !== null && b !== null && a === b)
  const repo: import('@me-me-en/domain').ConversationRepository = {
    findById: async (id) => state.find((c) => c.id === id) ?? null,
    findByPair: async (participants, rootPostId) => {
      const [a, b] = [...participants].sort()
      return (
        state.find(
          (c) =>
            c.participantIds[0] === a &&
            c.participantIds[1] === b &&
            sameRoot(rootPostId, c.rootPostId),
        ) ?? null
      )
    },
    save: async (conv) => {
      const idx = state.findIndex((c) => c.id === conv.id)
      if (idx >= 0) state[idx] = conv
      else state.push(conv)
    },
    listByUser: async (userId) =>
      state.filter((c) => c.participantIds[0] === userId || c.participantIds[1] === userId),
  }
  return { repo, state }
}

// In-memory PostRepository — only what conversation use cases need.
export const inMemoryPostRepo = (): {
  repo: import('@me-me-en/domain').PostRepository
  state: import('@me-me-en/domain').Post[]
} => {
  type P = import('@me-me-en/domain').Post
  const state: P[] = []
  const repo: import('@me-me-en/domain').PostRepository = {
    findById: async (id) => state.find((p) => p.id === id) ?? null,
    save: async (post) => {
      const idx = state.findIndex((p) => p.id === post.id)
      if (idx >= 0) state[idx] = post
      else state.push(post)
    },
    list: async () => state,
  }
  return { repo, state }
}

// In-memory BlockRepository — supports existsBetween (undirected).
export const inMemoryBlockRepo = (): {
  repo: import('@me-me-en/domain').BlockRepository
  state: import('@me-me-en/domain').Block[]
} => {
  type B = import('@me-me-en/domain').Block
  const state: B[] = []
  const repo: import('@me-me-en/domain').BlockRepository = {
    findById: async (id) => state.find((b) => b.id === id) ?? null,
    findBy: async (blockerId, blockedId) =>
      state.find((b) => b.blockerId === blockerId && b.blockedId === blockedId) ?? null,
    save: async (block) => {
      const idx = state.findIndex((b) => b.id === block.id)
      if (idx >= 0) state[idx] = block
      else state.push(block)
    },
    delete: async (id) => {
      const idx = state.findIndex((b) => b.id === id)
      if (idx >= 0) state.splice(idx, 1)
    },
    existsBetween: async (a, b) =>
      state.some(
        (x) =>
          (x.blockerId === a && x.blockedId === b) ||
          (x.blockerId === b && x.blockedId === a),
      ),
    listBlockedBy: async (blockerId) =>
      state.filter((b) => b.blockerId === blockerId).map((b) => b.blockedId),
  }
  return { repo, state }
}
