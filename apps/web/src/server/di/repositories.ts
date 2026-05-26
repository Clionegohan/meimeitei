import {
  createInMemoryAuthIdentityRepository,
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
  createPrismaAuthIdentityRepository,
  createPrismaBlockRepository,
  createPrismaConversationRepository,
  createPrismaLikeRepository,
  createPrismaLoginHistoryRepository,
  createPrismaMessageRepository,
  createPrismaPostRepository,
  createPrismaPresenceEventRepository,
  createPrismaUserRepository,
  prisma,
} from '@me-me-en/infrastructure'

// Process-scoped singleton repositories.
// DATA_STORE=memory (default) → in-memory adapters
// DATA_STORE=prisma → 全 persistent entity を Postgres に切替:
//   β-5-a: User
//   β-5-b: Conversation / Message / Post / Like / Block
//   β-5-c: LoginHistory / PresenceEvent / AuthIdentity
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

export const loginHistoryRepository =
  dataStore === 'prisma'
    ? createPrismaLoginHistoryRepository(prisma)
    : createInMemoryLoginHistoryRepository()

export const presenceEventRepository =
  dataStore === 'prisma'
    ? createPrismaPresenceEventRepository(prisma)
    : createInMemoryPresenceEventRepository()

export const authIdentityRepository =
  dataStore === 'prisma'
    ? createPrismaAuthIdentityRepository(prisma)
    : createInMemoryAuthIdentityRepository()

// 揮発系。
export const presenceRepository = createInMemoryPresenceRepository()
export const typingRepository = createInMemoryTypingRepository()
