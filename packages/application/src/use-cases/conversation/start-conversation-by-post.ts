import {
  createConversation,
  ForbiddenError,
  NotFoundError,
  type BlockRepository,
  type Conversation,
  type ConversationRepository,
  type PostId,
  type PostRepository,
  type UserId,
} from '@me-me-en/domain'
import type { BusinessHoursGuard } from '../../ports/business-hours-guard'
import type { Clock } from '../../ports/clock'
import type { IdGenerator } from '../../ports/id-generator'

export type StartConversationByPostDeps = {
  conversationRepository: ConversationRepository
  postRepository: PostRepository
  blockRepository: BlockRepository
  clock: Clock
  idGenerator: IdGenerator
  businessHoursGuard: BusinessHoursGuard
}

export type StartConversationByPostInput = {
  initiatorId: UserId
  postId: PostId
}

export type StartConversationByPost = (
  input: StartConversationByPostInput,
) => Promise<Conversation>

export const createStartConversationByPost = (
  deps: StartConversationByPostDeps,
): StartConversationByPost => async (input) => {
  deps.businessHoursGuard.ensureOpen()

  const post = await deps.postRepository.findById(input.postId)
  if (post === null) {
    throw new NotFoundError(`post ${input.postId} not found`)
  }

  const blocked = await deps.blockRepository.existsBetween(input.initiatorId, post.authorId)
  if (blocked) {
    throw new ForbiddenError('cannot start a conversation with a blocked user')
  }

  // DM 統合 (旧 spec R1「投稿ごと新規 conversation」を廃止):
  // 投稿への返信でも、相手との会話は 1 スレッドに統合する。
  // → 相手ごと 1 conversation (rootPostId は持たない)。既存があれば再利用。
  const existing = await deps.conversationRepository.findByPair(
    [input.initiatorId, post.authorId],
    null,
  )
  if (existing !== null) return existing

  const conv = createConversation({
    id: deps.idGenerator.conversation(),
    participants: [input.initiatorId, post.authorId],
    rootPostId: null,
    openedAt: deps.clock.now(),
  })
  await deps.conversationRepository.save(conv)
  return conv
}
