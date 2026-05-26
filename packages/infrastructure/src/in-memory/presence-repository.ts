import type { Presence, PresenceRepository, UserId } from '@me-me-en/domain'

// Volatile in-memory PresenceRepository. Keyed by userId. Server-process
// lifetime only; nothing is persisted across restarts.
export const createInMemoryPresenceRepository = (): PresenceRepository => {
  const store = new Map<UserId, Presence>()
  return {
    findByUser: async (userId) => store.get(userId) ?? null,
    set: async (presence) => {
      store.set(presence.userId, presence)
    },
    listOnline: async () =>
      Array.from(store.values()).filter((p) => p.status === 'online'),
  }
}
