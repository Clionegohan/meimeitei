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
