import type {
  Conversation,
  ConversationId,
  ConversationRepository,
  PostId,
  UserId,
} from '@me-me-en/domain'

export const createInMemoryConversationRepository = (): ConversationRepository => {
  const store = new Map<ConversationId, Conversation>()
  const sameRoot = (a: PostId | null, b: PostId | null): boolean => a === b
  return {
    findById: async (id) => store.get(id) ?? null,
    findByPair: async (participants, rootPostId) => {
      // domain Conversation.participantIds is already sorted ascending. Normalize
      // the input the same way to compare.
      const [pa, pb] =
        participants[0] < participants[1]
          ? participants
          : ([participants[1], participants[0]] as readonly [UserId, UserId])
      for (const c of store.values()) {
        if (
          c.participantIds[0] === pa &&
          c.participantIds[1] === pb &&
          sameRoot(rootPostId, c.rootPostId)
        ) {
          return c
        }
      }
      return null
    },
    save: async (conv) => {
      store.set(conv.id, conv)
    },
    listByUser: async (userId) => {
      const result: Conversation[] = []
      for (const c of store.values()) {
        if (c.participantIds[0] === userId || c.participantIds[1] === userId) {
          result.push(c)
        }
      }
      return result
    },
  }
}
