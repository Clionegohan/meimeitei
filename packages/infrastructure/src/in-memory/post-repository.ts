import type { Post, PostId, PostRepository } from '@me-me-en/domain'

// In-memory PostRepository. list orders desc by postedAt (spec C, newest first).
export const createInMemoryPostRepository = (): PostRepository => {
  const store = new Map<PostId, Post>()
  return {
    findById: async (id) => store.get(id) ?? null,
    save: async (post) => {
      store.set(post.id, post)
    },
    list: async (q) => {
      let result = Array.from(store.values())
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
}
