export { createInMemoryUserRepository } from './in-memory/user-repository'
export { createInMemoryConversationRepository } from './in-memory/conversation-repository'
export { createInMemoryMessageRepository } from './in-memory/message-repository'
export { createInMemoryBlockRepository } from './in-memory/block-repository'
export { createInMemoryPostRepository } from './in-memory/post-repository'
export { createInMemoryLikeRepository } from './in-memory/like-repository'
export { createInMemoryPresenceRepository } from './in-memory/presence-repository'
export { createInMemoryTypingRepository } from './in-memory/typing-repository'
export { createInMemoryLoginHistoryRepository } from './in-memory/login-history-repository'
export { createInMemoryPresenceEventRepository } from './in-memory/presence-event-repository'

// Prisma (Postgres) adapters — pilot phase (β-5-a): User のみ。
// 他 entity は順次追加していく予定。
export { prisma } from './prisma/client'
export { createPrismaUserRepository } from './prisma/user-repository'
