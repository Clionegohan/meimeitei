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

// Prisma (Postgres) adapters — coreフェーズ (β-5-a + β-5-b)。
// User / Conversation / Message / Post / Like / Block を実装済。
// LoginHistory / PresenceEvent / UserAuthIdentity は β-5-c で。
// Presence / Typing は揮発のため Prisma adapter を作らず in-memory のみ。
export { prisma } from './prisma/client'
export { createPrismaUserRepository } from './prisma/user-repository'
export { createPrismaConversationRepository } from './prisma/conversation-repository'
export { createPrismaMessageRepository } from './prisma/message-repository'
export { createPrismaPostRepository } from './prisma/post-repository'
export { createPrismaLikeRepository } from './prisma/like-repository'
export { createPrismaBlockRepository } from './prisma/block-repository'
