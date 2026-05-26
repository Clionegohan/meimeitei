import type {
  ConversationId,
  Typing,
  TypingRepository,
  UserId,
} from '@me-me-en/domain'

const TTL_MS = 5_000

// Volatile in-memory TypingRepository. Keyed by `${convId}:${userId}`.
// listActiveByConversation filters out entries past the 5s TTL based on
// the caller-supplied `now`.
export const createInMemoryTypingRepository = (): TypingRepository => {
  const store = new Map<string, Typing>()
  const key = (c: ConversationId, u: UserId) => `${c}:${u}`
  return {
    findByConversationAndUser: async (c, u) => store.get(key(c, u)) ?? null,
    set: async (t) => {
      store.set(key(t.conversationId, t.userId), t)
    },
    clear: async (c, u) => {
      store.delete(key(c, u))
    },
    listActiveByConversation: async (c, now) =>
      Array.from(store.values()).filter(
        (t) =>
          t.conversationId === c && now.getTime() - t.startedAt.getTime() < TTL_MS,
      ),
  }
}
