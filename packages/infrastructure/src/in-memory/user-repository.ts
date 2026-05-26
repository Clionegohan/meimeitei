import type { User, UserId, UserRepository } from '@me-me-en/domain'

// In-memory UserRepository — production-grade fallback for DATA_STORE=memory.
// Nickname uniqueness is the use case's responsibility; this store is a
// flat Map keyed by id.
export const createInMemoryUserRepository = (): UserRepository => {
  const store = new Map<UserId, User>()
  return {
    findById: async (id) => store.get(id) ?? null,
    findByNickname: async (nickname) => {
      for (const u of store.values()) if (u.nickname === nickname) return u
      return null
    },
    save: async (user) => {
      store.set(user.id, user)
    },
    list: async () => Array.from(store.values()),
  }
}
