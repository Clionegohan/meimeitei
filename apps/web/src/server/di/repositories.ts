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
  createPrismaUserRepository,
  prisma,
} from '@me-me-en/infrastructure'

// Process-scoped singleton repositories.
// DATA_STORE=memory (default) → in-memory adapters
// DATA_STORE=prisma → 用意できた entity から順に Prisma に差し替え。
//   β-5-a: User のみ pilot。他 entity は in-memory のままで動く混在モード。
const dataStore = process.env.DATA_STORE === 'prisma' ? 'prisma' : 'memory'

export const userRepository =
  dataStore === 'prisma'
    ? createPrismaUserRepository(prisma)
    : createInMemoryUserRepository()

export const conversationRepository = createInMemoryConversationRepository()
export const messageRepository = createInMemoryMessageRepository()
export const blockRepository = createInMemoryBlockRepository()
export const postRepository = createInMemoryPostRepository()
export const likeRepository = createInMemoryLikeRepository(postRepository)
export const presenceRepository = createInMemoryPresenceRepository()
export const typingRepository = createInMemoryTypingRepository()
export const loginHistoryRepository = createInMemoryLoginHistoryRepository()
export const presenceEventRepository = createInMemoryPresenceEventRepository()
