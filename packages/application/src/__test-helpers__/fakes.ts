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

// In-memory PostRepository — supports nightId / authorId / before / limit.
// Order: descending by postedAt (spec C, newest first).
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
    list: async (q) => {
      let result = state.slice()
      if (q.nightId !== undefined) result = result.filter((p) => p.nightId === q.nightId)
      if (q.authorId !== undefined) result = result.filter((p) => p.authorId === q.authorId)
      if (q.before !== undefined) {
        const before = q.before
        result = result.filter((p) => p.postedAt.getTime() < before.getTime())
      }
      result.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
      return q.limit ? result.slice(0, q.limit) : result
    },
  }
  return { repo, state }
}

// In-memory MessageRepository.
export const inMemoryMessageRepo = (): {
  repo: import('@me-me-en/domain').MessageRepository
  state: import('@me-me-en/domain').Message[]
} => {
  type M = import('@me-me-en/domain').Message
  const state: M[] = []
  const repo: import('@me-me-en/domain').MessageRepository = {
    findById: async (id) => state.find((m) => m.id === id) ?? null,
    save: async (msg) => {
      const idx = state.findIndex((m) => m.id === msg.id)
      if (idx >= 0) state[idx] = msg
      else state.push(msg)
    },
    listByConversation: async (q) => {
      const byConv = state.filter((m) => m.conversationId === q.conversationId)
      const beforeFiltered = q.before
        ? byConv.filter((m) => m.sentAt.getTime() < q.before!.getTime())
        : byConv
      // ascending by sentAt (chat convention)
      const sorted = [...beforeFiltered].sort(
        (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
      )
      return q.limit ? sorted.slice(0, q.limit) : sorted
    },
  }
  return { repo, state }
}

// In-memory LikeRepository.
// Note: countReceivedByUser returns 0 in this fake — it would require
// cross-repo knowledge of post authors. Use cases that depend on it
// (来店帳統計) are tested separately when needed.
export const inMemoryLikeRepo = (): {
  repo: import('@me-me-en/domain').LikeRepository
  state: import('@me-me-en/domain').Like[]
} => {
  type L = import('@me-me-en/domain').Like
  const state: L[] = []
  const repo: import('@me-me-en/domain').LikeRepository = {
    findById: async (id) => state.find((l) => l.id === id) ?? null,
    findByPostAndUser: async (postId, userId) =>
      state.find((l) => l.postId === postId && l.userId === userId) ?? null,
    save: async (like) => {
      const idx = state.findIndex((l) => l.id === like.id)
      if (idx >= 0) state[idx] = like
      else state.push(like)
    },
    delete: async (id) => {
      const idx = state.findIndex((l) => l.id === id)
      if (idx >= 0) state.splice(idx, 1)
    },
    countByPost: async (postId) => state.filter((l) => l.postId === postId).length,
    countReceivedByUser: async () => 0,
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

// In-memory PresenceRepository — volatile, keyed by userId.
export const inMemoryPresenceRepo = (): {
  repo: import('@me-me-en/domain').PresenceRepository
  state: Map<import('@me-me-en/domain').UserId, import('@me-me-en/domain').Presence>
} => {
  const state = new Map<
    import('@me-me-en/domain').UserId,
    import('@me-me-en/domain').Presence
  >()
  const repo: import('@me-me-en/domain').PresenceRepository = {
    findByUser: async (userId) => state.get(userId) ?? null,
    set: async (presence) => {
      state.set(presence.userId, presence)
    },
    listOnline: async () =>
      Array.from(state.values()).filter((p) => p.status === 'online'),
  }
  return { repo, state }
}

// In-memory TypingRepository — volatile, keyed by (convId, userId).
export const inMemoryTypingRepo = (): {
  repo: import('@me-me-en/domain').TypingRepository
  state: Map<string, import('@me-me-en/domain').Typing>
} => {
  const state = new Map<string, import('@me-me-en/domain').Typing>()
  const key = (
    c: import('@me-me-en/domain').ConversationId,
    u: import('@me-me-en/domain').UserId,
  ) => `${c}:${u}`
  const TTL = 5_000
  const repo: import('@me-me-en/domain').TypingRepository = {
    findByConversationAndUser: async (c, u) => state.get(key(c, u)) ?? null,
    set: async (t) => {
      state.set(key(t.conversationId, t.userId), t)
    },
    clear: async (c, u) => {
      state.delete(key(c, u))
    },
    listActiveByConversation: async (c, now) =>
      Array.from(state.values()).filter(
        (t) => t.conversationId === c && now.getTime() - t.startedAt.getTime() < TTL,
      ),
  }
  return { repo, state }
}
