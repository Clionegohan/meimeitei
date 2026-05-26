import type {
  Message,
  MessageId,
  MessageRepository,
} from '@me-me-en/domain'

// In-memory MessageRepository. Ascending by sentAt (chat convention).
// before/limit form cursor-based pagination.
export const createInMemoryMessageRepository = (): MessageRepository => {
  const store = new Map<MessageId, Message>()
  return {
    findById: async (id) => store.get(id) ?? null,
    save: async (msg) => {
      store.set(msg.id, msg)
    },
    listByConversation: async (q) => {
      let result = Array.from(store.values()).filter(
        (m) => m.conversationId === q.conversationId,
      )
      if (q.before !== undefined) {
        const before = q.before
        result = result.filter((m) => m.sentAt.getTime() < before.getTime())
      }
      result.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime())
      return q.limit ? result.slice(0, q.limit) : result
    },
    countByConversationsInWindow: async (ids, from, to) => {
      const idSet = new Set(ids)
      const counts = new Map<typeof ids[number], number>()
      for (const id of ids) counts.set(id, 0)
      const fromMs = from.getTime()
      const toMs = to.getTime()
      for (const m of store.values()) {
        if (!idSet.has(m.conversationId)) continue
        const t = m.sentAt.getTime()
        if (t < fromMs || t >= toMs) continue
        counts.set(m.conversationId, (counts.get(m.conversationId) ?? 0) + 1)
      }
      return counts
    },
  }
}
