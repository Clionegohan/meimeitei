import {
  createInMemoryBlockRepository,
  createInMemoryConversationRepository,
  createInMemoryLikeRepository,
  createInMemoryLoginHistoryRepository,
  createInMemoryMessageRepository,
  createInMemoryPostRepository,
  createInMemoryPresenceEventRepository,
  createInMemoryPresenceRepository,
  createInMemoryTypingRepository,
  createInMemoryUserRepository,
  createPrismaBlockRepository,
  createPrismaConversationRepository,
  createPrismaLikeRepository,
  createPrismaMessageRepository,
  createPrismaPostRepository,
  createPrismaUserRepository,
  prisma,
} from '@me-me-en/infrastructure'

// Process-scoped singleton repositories.
// DATA_STORE=memory (default) → in-memory adapters
// DATA_STORE=prisma → core entity を Postgres に切替:
//   β-5-a: User
//   β-5-b: Conversation / Message / Post / Like / Block
// 残り (LoginHistory / PresenceEvent / UserAuthIdentity) は β-5-c で。
// Presence / Typing は揮発のため永続化せず常に in-memory。
const dataStore = process.env.DATA_STORE === 'prisma' ? 'prisma' : 'memory'

export const userRepository =
  dataStore === 'prisma'
    ? createPrismaUserRepository(prisma)
    : createInMemoryUserRepository()

export const conversationRepository =
  dataStore === 'prisma'
    ? createPrismaConversationRepository(prisma)
    : createInMemoryConversationRepository()

export const messageRepository =
  dataStore === 'prisma'
    ? createPrismaMessageRepository(prisma)
    : createInMemoryMessageRepository()

export const postRepository =
  dataStore === 'prisma'
    ? createPrismaPostRepository(prisma)
    : createInMemoryPostRepository()

export const likeRepository =
  dataStore === 'prisma'
    ? createPrismaLikeRepository(prisma, postRepository)
    : createInMemoryLikeRepository(postRepository)

export const blockRepository =
  dataStore === 'prisma'
    ? createPrismaBlockRepository(prisma)
    : createInMemoryBlockRepository()

// 揮発系。永続化候補は β-5 完了後の検討事項。
export const presenceRepository = createInMemoryPresenceRepository()
export const typingRepository = createInMemoryTypingRepository()

// β-5-c で Prisma adapter に切替予定。
export const loginHistoryRepository = createInMemoryLoginHistoryRepository()
export const presenceEventRepository = createInMemoryPresenceEventRepository()
