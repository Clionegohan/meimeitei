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
import type {
  AuthIdentityRepository,
  BlockRepository,
  ConversationRepository,
  LikeRepository,
  LoginHistoryRepository,
  MessageRepository,
  PostRepository,
  PresenceEventRepository,
  PresenceRepository,
  TypingRepository,
  UserRepository,
} from '@me-me-en/domain'

// Process-scoped singleton repositories.
// DATA_STORE=memory (default) → in-memory adapters
// DATA_STORE=prisma → 全 persistent entity を Postgres に切替:
//   β-5-a: User
//   β-5-b: Conversation / Message / Post / Like / Block
//   β-5-c: LoginHistory / PresenceEvent / AuthIdentity
// Presence / Typing は揮発のため永続化せず常に in-memory。
//
// dev HMR で module が再 load されても in-memory state を保つため、
// PrismaClient と同じく globalThis に逃がしておく (Next.js 公式 pattern)。
const dataStore = process.env.DATA_STORE === 'prisma' ? 'prisma' : 'memory'

type RepoBag = {
  user: UserRepository
  conversation: ConversationRepository
  message: MessageRepository
  post: PostRepository
  like: LikeRepository
  block: BlockRepository
  loginHistory: LoginHistoryRepository
  presenceEvent: PresenceEventRepository
  authIdentity: AuthIdentityRepository
  presence: PresenceRepository
  typing: TypingRepository
}

const globalForRepos = globalThis as unknown as { __meMeEnRepos?: RepoBag }

const buildRepos = (): RepoBag => {
  const post =
    dataStore === 'prisma'
      ? createPrismaPostRepository(prisma)
      : createInMemoryPostRepository()
  return {
    user:
      dataStore === 'prisma'
        ? createPrismaUserRepository(prisma)
        : createInMemoryUserRepository(),
    conversation:
      dataStore === 'prisma'
        ? createPrismaConversationRepository(prisma)
        : createInMemoryConversationRepository(),
    message:
      dataStore === 'prisma'
        ? createPrismaMessageRepository(prisma)
        : createInMemoryMessageRepository(),
    post,
    like:
      dataStore === 'prisma'
        ? createPrismaLikeRepository(prisma, post)
        : createInMemoryLikeRepository(post),
    block:
      dataStore === 'prisma'
        ? createPrismaBlockRepository(prisma)
        : createInMemoryBlockRepository(),
    loginHistory:
      dataStore === 'prisma'
        ? createPrismaLoginHistoryRepository(prisma)
        : createInMemoryLoginHistoryRepository(),
    presenceEvent:
      dataStore === 'prisma'
        ? createPrismaPresenceEventRepository(prisma)
        : createInMemoryPresenceEventRepository(),
    authIdentity:
      dataStore === 'prisma'
        ? createPrismaAuthIdentityRepository(prisma)
        : createInMemoryAuthIdentityRepository(),
    presence: createInMemoryPresenceRepository(),
    typing: createInMemoryTypingRepository(),
  }
}

const repos: RepoBag = globalForRepos.__meMeEnRepos ?? buildRepos()
if (process.env.NODE_ENV !== 'production') {
  globalForRepos.__meMeEnRepos = repos
}

export const userRepository = repos.user
export const conversationRepository = repos.conversation
export const messageRepository = repos.message
export const postRepository = repos.post
export const likeRepository = repos.like
export const blockRepository = repos.block
export const loginHistoryRepository = repos.loginHistory
export const presenceEventRepository = repos.presenceEvent
export const authIdentityRepository = repos.authIdentity
export const presenceRepository = repos.presence
export const typingRepository = repos.typing
