'use server'

import { auth } from '@/auth'
import {
  createPost,
  likePost,
  startConversationByPost,
  unlikePost,
} from '@/server/di'
import { broadcastToAll } from '@/server/realtime/io-bridge'
import type { PostId } from '@me-me-en/domain'

export type PostDto = {
  id: string
  authorId: string
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
    const dto: PostDto = {
      id: post.id,
      authorId: post.authorId,
      body: post.body,
      postedAt: post.postedAt.toISOString(),
      nightId: post.nightId,
      iLiked: false,
    }
    // Realtime fan-out to every connected socket. Receiving clients dedupe by id.
    broadcastToAll('post:new', dto)
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
