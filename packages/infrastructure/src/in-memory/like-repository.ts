import type {
  Like,
  LikeId,
  LikeRepository,
  PostRepository,
} from '@me-me-en/domain'

// In-memory LikeRepository. countReceivedByUser requires the post author
// information, so this adapter takes a PostRepository dependency.
export const createInMemoryLikeRepository = (
  postRepository: PostRepository,
): LikeRepository => {
  const store = new Map<LikeId, Like>()
  return {
    findById: async (id) => store.get(id) ?? null,
    findByPostAndUser: async (postId, userId) => {
      for (const l of store.values()) {
        if (l.postId === postId && l.userId === userId) return l
      }
      return null
    },
    save: async (like) => {
      store.set(like.id, like)
    },
    delete: async (id) => {
      store.delete(id)
    },
    countByPost: async (postId) => {
      let count = 0
      for (const l of store.values()) if (l.postId === postId) count++
      return count
    },
    countReceivedByUser: async (userId) => {
      const ownPosts = await postRepository.list({ authorId: userId })
      const ownPostIds = new Set(ownPosts.map((p) => p.id))
      let count = 0
      for (const l of store.values()) if (ownPostIds.has(l.postId)) count++
      return count
    },
  }
}
