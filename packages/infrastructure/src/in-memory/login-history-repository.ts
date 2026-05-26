import type {
  LoginHistoryRepository,
  NightId,
  UserId,
} from '@me-me-en/domain'

// In-memory LoginHistoryRepository.
// Stores nights as a `Map<UserId, Map<NightId, firstSeenAt>>` so recording is
// O(1) and idempotent per (user, night).
export const createInMemoryLoginHistoryRepository = (): LoginHistoryRepository => {
  const store = new Map<UserId, Map<NightId, Date>>()
  return {
    recordIfFirstOfNight: async (userId, nightId, at) => {
      let nights = store.get(userId)
      if (nights === undefined) {
        nights = new Map<NightId, Date>()
        store.set(userId, nights)
      }
      if (!nights.has(nightId)) nights.set(nightId, at)
    },
    listNightsByUser: async (userId) => {
      const nights = store.get(userId)
      if (nights === undefined) return []
      // NightId is YYYY-MM-DD, so lex desc == chronological desc.
      return Array.from(nights.keys()).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    },
  }
}
