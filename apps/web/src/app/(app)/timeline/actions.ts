'use server'

import { auth } from '@/auth'
import {
  blockRepository,
  createPost,
  likePost,
  startConversationByPost,
  unlikePost,
  userRepository,
} from '@/server/di'
import { broadcastToAllExcept } from '@/server/realtime/io-bridge'
import type { PostId } from '@me-me-en/domain'

export type PostDto = {
  id: string
  authorId: string
  authorNickname: string
  authorTone: string
  body: string
  postedAt: string
  nightId: string
  iLiked: boolean
}

export type CreatePostResult =
  | { ok: true; post: PostDto }
  | { ok: false; error: string }

export const createPostAction = async (input: {
  body: string
}): Promise<CreatePostResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    const post = await createPost({ authorId: session.userId, body: input.body })
    const author = await userRepository.findById(post.authorId)
    const dto: PostDto = {
      id: post.id,
      authorId: post.authorId,
      authorNickname: author?.nickname ?? '名なし',
      authorTone: author?.tone ?? '#E8E2D2',
      body: post.body,
      postedAt: post.postedAt.toISOString(),
      nightId: post.nightId,
      iLiked: false,
    }
    // Block-aware fan-out: 著者を block している人 / 著者が block した人を除外する。
    // listConversations / listTimeline と同じ無向 block ポリシーに揃える。
    const [blockedByAuthor, blockersOfAuthor] = await Promise.all([
      blockRepository.listBlockedBy(post.authorId),
      blockRepository.listBlockersOf(post.authorId),
    ])
    const exclude = Array.from(new Set([...blockedByAuthor, ...blockersOfAuthor]))
    broadcastToAllExcept(exclude, 'post:new', dto)
    return { ok: true, post: dto }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}

export type LikeResult = { ok: true } | { ok: false; error: string }

export const likePostAction = async (input: {
  postId: string
}): Promise<LikeResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    await likePost({ userId: session.userId, postId: input.postId as PostId })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}

export const unlikePostAction = async (input: {
  postId: string
}): Promise<LikeResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    await unlikePost({ userId: session.userId, postId: input.postId as PostId })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}

export type ReplyResult =
  | { ok: true; conversationId: string }
  | { ok: false; error: string }

export const replyToPostAction = async (input: {
  postId: string
}): Promise<ReplyResult> => {
  const session = await auth()
  if (session === null || session.userId === undefined) {
    return { ok: false, error: 'ログインが必要です' }
  }
  try {
    const conv = await startConversationByPost({
      initiatorId: session.userId,
      postId: input.postId as PostId,
    })
    return { ok: true, conversationId: conv.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '不明なエラー' }
  }
}
