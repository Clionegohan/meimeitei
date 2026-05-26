import type { Block, BlockId, BlockRepository, UserId } from '@me-me-en/domain'

export const createInMemoryBlockRepository = (): BlockRepository => {
  const store = new Map<BlockId, Block>()
  return {
    findById: async (id) => store.get(id) ?? null,
    findBy: async (blockerId, blockedId) => {
      for (const b of store.values()) {
        if (b.blockerId === blockerId && b.blockedId === blockedId) return b
      }
      return null
    },
    save: async (block) => {
      store.set(block.id, block)
    },
    delete: async (id) => {
      store.delete(id)
    },
    existsBetween: async (a, b) => {
      for (const x of store.values()) {
        if (
          (x.blockerId === a && x.blockedId === b) ||
          (x.blockerId === b && x.blockedId === a)
        ) {
          return true
        }
      }
      return false
    },
    listBlockedBy: async (blockerId) => {
      const result: UserId[] = []
      for (const b of store.values()) {
        if (b.blockerId === blockerId) result.push(b.blockedId)
      }
      return result
    },
  }
}
