import {
  createInMemoryBlockRepository,
  createInMemoryConversationRepository,
  createInMemoryLikeRepository,
  createInMemoryMessageRepository,
  createInMemoryPostRepository,
  createInMemoryPresenceRepository,
  createInMemoryTypingRepository,
  createInMemoryUserRepository,
} from '@me-me-en/infrastructure'

// Process-scoped singleton repositories. With DATA_STORE=memory these hold
// state until the process restarts. The future Prisma adapter swaps in here
// behind the same domain ports without touching the use cases.
export const userRepository = createInMemoryUserRepository()
export const conversationRepository = createInMemoryConversationRepository()
export const messageRepository = createInMemoryMessageRepository()
export const blockRepository = createInMemoryBlockRepository()
export const postRepository = createInMemoryPostRepository()
export const likeRepository = createInMemoryLikeRepository(postRepository)
export const presenceRepository = createInMemoryPresenceRepository()
export const typingRepository = createInMemoryTypingRepository()
